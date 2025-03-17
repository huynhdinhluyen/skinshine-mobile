import React, { useState, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ToastAndroid,
  ScrollView,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { getOrders } from "@/services/order.service";
import { Order } from "@/types/order/order";
import { Ionicons, FontAwesome, AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { debounce } from "lodash";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const statusColors = {
  PENDING: "#ff9f43",
  CONFIRMED: "#1e90ff",
  SHIPPING: "#8e44ad",
  DELIVERED: "#2ecc71",
  CANCELLED: "#e74c3c",
};

const statusNames = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đang xử lý",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

type FilterStatus =
  | "ALL"
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED";

const OrderItem = memo(({ item, onPress }: { item: Order, onPress: (id: string) => void }) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <TouchableOpacity
            style={styles.orderItem}
            onPress={() => onPress(item._id)}
        >
            <View style={styles.orderHeader}>
                <View style={styles.orderIdContainer}>
                    <Text style={styles.orderId}>
                        Đơn #{item._id.slice(-8).toUpperCase()}
                    </Text>
                </View>
                <View
                    style={[
                        styles.statusBadge,
                        {
                            backgroundColor:
                                statusColors[item.orderStatus as keyof typeof statusColors] ||
                                "#999",
                        },
                    ]}
                >
                    <Text style={styles.statusText}>
                        {statusNames[item.orderStatus as keyof typeof statusNames] ||
                            item.orderStatus}
                    </Text>
                </View>
            </View>

            <View style={styles.orderInfo}>
                <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Khách hàng</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>
                            {item.user?.fullName || "Không có tên"}
                        </Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>SĐT</Text>
                        <Text style={styles.infoValue}>
                            {item.shippingAddress?.phone || "N/A"}
                        </Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Ngày đặt</Text>
                        <Text style={styles.infoValue}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Tổng tiền</Text>
                        <Text style={[styles.infoValue, styles.priceText]}>
                            {item.totalPrice.toLocaleString()}đ
                        </Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <View style={styles.fullWidthItem}>
                        <Text style={styles.infoLabel}>Địa chỉ</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>
                            {item.shippingAddress?.addressLine1},{" "}
                            {item.shippingAddress?.city}
                        </Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Số sản phẩm</Text>
                        <Text style={styles.infoValue}>
                            {item.totalQuantity} sản phẩm
                        </Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Thanh toán</Text>
                        <Text style={styles.infoValue}>
                            {item.payment?.paymentMethod || "COD"}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.viewDetailsContainer}>
                <Text style={styles.viewDetails}>Xem chi tiết</Text>
                <AntDesign name="right" size={12} color="#2f95dc" />
            </View>
        </TouchableOpacity>
    );
});

export default function StaffOrdersScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [totalOrders, setTotalOrders] = useState(0);

    const fetchOrders = useCallback(
        async (pageNum: number = 1, status?: string) => {
            if (!user?.token) {
                ToastAndroid.show(
                    "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!",
                    ToastAndroid.LONG
                );
                router.replace("/login");
                return;
            }

            try {
                setLoading(pageNum === 1);

                const params: any = {
                    page: pageNum,
                    limit: 10,
                    sortBy: "createdAt_desc",
                };

                if (status && status !== "ALL") {
                    params.status = status;
                }

                // Call the getOrders function with the user token
                const result = await getOrders(user.token, params);

                if (result) {
                    // Access the orders array from the result
                    const ordersList = result.orders || [];

                    if (pageNum === 1) {
                        setOrders(ordersList);
                    } else {
                        setOrders((prev) => [...prev, ...ordersList]);
                    }

                    setTotalOrders(result.total || 0);
                    setHasMore(ordersList.length === 10); // If we get back 10 items, assume there are more
                    setPage(pageNum);
                } else {
                    // Handle case when result is null (error occurred)
                    ToastAndroid.show("Không thể tải dữ liệu đơn hàng", ToastAndroid.SHORT);
                    if (pageNum === 1) {
                        setOrders([]);
                        setTotalOrders(0);
                    }
                    setHasMore(false);
                }
            } catch (error) {
                console.error("Error fetching orders:", error);
                ToastAndroid.show(
                    "Không thể lấy danh sách đơn hàng",
                    ToastAndroid.SHORT
                );

                if (pageNum === 1) {
                    setOrders([]);
                    setTotalOrders(0);
                }
                setHasMore(false);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [user, router]
    );

  useEffect(() => {
    fetchOrders(1, filterStatus);
  }, [fetchOrders, filterStatus]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders(1, filterStatus);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchOrders(page + 1, filterStatus);
    }
  };

    const handleOrderPress = useCallback((orderId: string) => {
        router.push(`/staff/orders/${orderId}`);
    }, [router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSearch = debounce((text: string) => {
    fetchOrders(1, filterStatus);
  }, 500);

  const renderFilterButton = (
    status: FilterStatus,
    label: string,
    icon: string
  ) => {
    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          filterStatus === status && styles.filterButtonActive,
        ]}
        onPress={() => setFilterStatus(status)}
      >
        <FontAwesome
          name={icon as any}
          size={14}
          color={filterStatus === status ? "#fff" : "#555"}
        />
        <Text
          style={[
            styles.filterButtonText,
            filterStatus === status && styles.filterButtonTextActive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    return (
      <TouchableOpacity
        style={styles.orderItem}
        onPress={() => handleOrderPress(item._id)}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <Text style={styles.orderId}>
              Đơn #{item._id.slice(-8).toUpperCase()}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  statusColors[item.orderStatus as keyof typeof statusColors] ||
                  "#999",
              },
            ]}
          >
            <Text style={styles.statusText}>
              {statusNames[item.orderStatus as keyof typeof statusNames] ||
                item.orderStatus}
            </Text>
          </View>
        </View>

        <View style={styles.orderInfo}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Khách hàng</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {item.user?.fullName || "Không có tên"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>SĐT</Text>
              <Text style={styles.infoValue}>
                {item.shippingAddress?.phone || "N/A"}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ngày đặt</Text>
              <Text style={styles.infoValue}>{formatDate(item.createdAt)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tổng tiền</Text>
              <Text style={[styles.infoValue, styles.priceText]}>
                {item.totalPrice.toLocaleString()}đ
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.fullWidthItem}>
              <Text style={styles.infoLabel}>Địa chỉ</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {item.shippingAddress?.addressLine1},{" "}
                {item.shippingAddress?.city}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Số sản phẩm</Text>
              <Text style={styles.infoValue}>
                {item.totalQuantity} sản phẩm
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Thanh toán</Text>
              <Text style={styles.infoValue}>COD</Text>
            </View>
          </View>
        </View>

        <View style={styles.viewDetailsContainer}>
          <Text style={styles.viewDetails}>Xem chi tiết</Text>
          <AntDesign name="right" size={12} color="#2f95dc" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm theo ID, khách hàng, số điện thoại..."
              placeholderTextColor="#999"
              onChangeText={handleSearch}
            />
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScrollContent}
          >
            {renderFilterButton("ALL", "Tất cả", "list")}
            {renderFilterButton("PENDING", "Chờ xử lý", "clock-o")}
            {renderFilterButton("CONFIRMED", "Đang xử lý", "refresh")}
            {renderFilterButton("SHIPPING", "Đang giao", "truck")}
            {renderFilterButton("DELIVERED", "Đã giao", "check-circle")}
            {renderFilterButton("CANCELLED", "Đã hủy", "times-circle")}
          </ScrollView>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            Tổng số: <Text style={styles.statsNumber}>{totalOrders}</Text> đơn
            hàng
            {filterStatus !== "ALL" &&
              ` - ${statusNames[filterStatus] || filterStatus}: ${
                orders.length
              }`}
          </Text>
        </View>

        {/* Orders List */}
          {loading && !refreshing ? (
              <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color="#2f95dc" />
                  <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
              </View>
          ) : (
              <FlatList
                  data={orders}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                      <OrderItem item={item} onPress={handleOrderPress} />
                  )}
                  refreshControl={
                      <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                  }
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.5}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  removeClippedSubviews={true}
                  ListFooterComponent={
                      hasMore && !refreshing ? (
                          <View style={styles.footerLoader}>
                              <ActivityIndicator size="small" color="#999" />
                          </View>
                      ) : null
                  }
                  ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                          <FontAwesome name="inbox" size={60} color="#ddd" />
                          <Text style={styles.emptyText}>Không có đơn hàng</Text>
                      </View>
                  }
                  contentContainerStyle={orders.length === 0 ? { flex: 1 } : null}
              />
          )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchContainer: {
    backgroundColor: "#fff",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: "#333",
  },
  filtersContainer: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filtersScrollContent: {
    paddingHorizontal: 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 6,
  },
  filterButtonActive: {
    backgroundColor: "#2f95dc",
  },
  filterButtonText: {
    fontSize: 12,
    marginLeft: 5,
    color: "#555",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  statsContainer: {
    backgroundColor: "#fff",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  statsText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
  statsNumber: {
    fontWeight: "bold",
    color: "#2f95dc",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  orderItem: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  orderIdContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  orderInfo: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  infoItem: {
    flex: 1,
  },
  fullWidthItem: {
    flex: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 13,
    color: "#333",
  },
  priceText: {
    fontWeight: "600",
    color: "#e53935",
  },
  viewDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  viewDetails: {
    fontSize: 13,
    color: "#2f95dc",
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    color: "#999",
    fontSize: 16,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
