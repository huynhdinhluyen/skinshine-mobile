import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "expo-router/build/hooks";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

/** Mapping status tiếng Anh -> tiếng Việt */
const ORDER_STATUS_MAP: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPED: "Đã gửi hàng",
  SHIPPING: "Đang vận chuyển",
  DELIVERED: "Đã giao hàng",
  CANCELLED: "Đã hủy",
  RETURNED: "Đã trả hàng",
  REFUNDED: "Đã hoàn tiền",
  FAILED: "Thất bại",
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, setUser } = useAuth();
  const searchParams = useSearchParams();

  const initialTab =
    searchParams.get("tab") === "orders" ? "orders" : "profile";
  const [activeTab, setActiveTab] = useState<"profile" | "orders">(initialTab);

  // =================================
  // State tab
  // =================================
  useEffect(() => {
    if (activeTab === "orders" && user) {
      setPage(1);
      fetchOrders(1, false);
    }
  }, [activeTab]);

  // =================================
  // State Profile
  // =================================
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  // Đổi mật khẩu
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // =================================
  // State Orders
  // =================================
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Modal confirm hủy đơn
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // (**) Mới: State cho modal đánh giá sản phẩm
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<string>("5"); // tạm để string, người dùng nhập 1-5
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackProductId, setFeedbackProductId] = useState<string>("");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setCity(user.city || "");
    }
  }, [user]);

  // Khi chuyển tab sang "orders", load danh sách đơn hàng
  useEffect(() => {
    if (activeTab === "orders" && user) {
      setPage(1);
      fetchOrders(1, false);
    }
  }, [activeTab]);

  // =========================
  // API GỌI ĐƠN HÀNG
  // =========================
  const fetchOrders = async (pageNumber: number, loadMore: boolean) => {
    if (!user) return;
    const token = user.token;
    const userId = user.id;

    if (!loadMore) {
      setLoadingOrders(true);
    } else {
      setLoadingMore(true);
    }

    try {
      // Gọi API: GET /orders?userId=xxx&page=xxx&limit=xxx
      const url = `${API_URL}/orders?userId=${userId}&page=${pageNumber}&limit=${limit}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        const orderList = data?.data?.data || [];
        const totalPagesFromAPI = data?.data?.totalPages || 1;

        if (pageNumber === 1) {
          setOrders(orderList);
        } else {
          setOrders((prev) => [...prev, ...orderList]);
        }
        setTotalPages(totalPagesFromAPI);
      } else {
        Alert.alert("Lỗi", data?.message || "Không thể tải đơn hàng");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      Alert.alert("Lỗi", "Không thể kết nối tới server");
    } finally {
      setLoadingOrders(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchOrders(nextPage, true);
    }
  };

  // =========================
  // ĐĂNG NHẬP / ĐĂNG KÝ / ĐĂNG XUẤT
  // =========================
  const handleGoLogin = () => {
    router.push("/login");
  };
  const handleGoSignup = () => {
    router.push("/signup");
  };
  const handleLogout = async () => {
    await logout();
  };

  // =========================
  // CẬP NHẬT HỒ SƠ
  // =========================
  const handleUpdateProfile = async () => {
    try {
      if (!user) {
        Alert.alert("Lỗi", "Bạn chưa đăng nhập");
        return;
      }
      const userId = user.id;
      const token = user.token;

      const response = await fetch(`${API_URL}/auth/${userId}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          city,
          address,
          phone,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const updatedUser = { ...user, ...data.data };
        setUser(updatedUser);
        Alert.alert("Thông báo", "Cập nhật thành công.");
      } else {
        Alert.alert("Lỗi", data?.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Lỗi", "Không thể kết nối tới server");
    }
  };

  // =========================
  // ĐỔI MẬT KHẨU
  // =========================
  const handleChangePassword = async () => {
    try {
      if (!user) {
        Alert.alert("Lỗi", "Bạn chưa đăng nhập");
        return;
      }
      const userId = user.id;
      const token = user.token;

      const response = await fetch(
        `${API_URL}/auth/${userId}/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            oldPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        Alert.alert(
          "Thông báo",
          "Đổi mật khẩu thành công. Mời bạn đăng nhập lại"
        );
        setOldPassword("");
        setNewPassword("");
        await logout();
      } else {
        Alert.alert("Lỗi", data?.message || "Đổi mật khẩu thất bại");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      Alert.alert("Lỗi", "Không thể kết nối tới server");
    }
  };

  // =========================
  // HỦY ĐƠN HÀNG
  // =========================
  const handleCancelOrder = async (orderId: string) => {
    try {
      if (!user) return;
      const token = user.token;

      // Gọi API PATCH /orders/:orderId/status với body { status: "CANCELLED" }
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!response.ok) {
        const data = await response.json();
        Alert.alert("Lỗi", data?.message || "Không thể hủy đơn hàng");
        return;
      }

      // Thành công -> Thông báo, rồi fetchOrders lại
      Alert.alert("Thông báo", "Hủy đơn hàng thành công!");
      setPage(1);
      fetchOrders(1, false);
    } catch (error) {
      console.error("Error canceling order:", error);
      Alert.alert("Lỗi", "Không thể hủy đơn hàng");
    }
  };

  // =========================
  // (**) MỚI: MỞ MODAL ĐÁNH GIÁ
  // =========================
  const openFeedbackModal = (productId: string) => {
    setFeedbackProductId(productId);
    setFeedbackRating("5");
    setFeedbackContent("");
    setShowFeedbackModal(true);
  };

  // =========================
  // (**) MỚI: GỌI API POST FEEDBACK
  // =========================
  const handleSubmitFeedback = async () => {
    try {
      if (!user) {
        Alert.alert("Lỗi", "Bạn chưa đăng nhập");
        return;
      }
      const token = user.token;

      // rating là string, cần parse sang number
      const ratingNumber = parseInt(feedbackRating, 10);
      if (isNaN(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
        Alert.alert("Lỗi", "Vui lòng nhập điểm đánh giá từ 1 đến 5.");
        return;
      }

      const response = await fetch(`${API_URL}/feedbacks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: feedbackProductId,
          rating: ratingNumber,
          content: feedbackContent,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Thành công", "Cảm ơn bạn đã đánh giá sản phẩm!");
        setShowFeedbackModal(false);
      } else {
        Alert.alert("Lỗi", data?.message || "Không thể gửi đánh giá");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Alert.alert("Lỗi", "Không thể kết nối tới server");
    }
  };

  function renderOrderItem(item: any, orderStatus: string) {
    const product = item.productId || {};
    const productName = product.name || "Tên sản phẩm";
    const productImage =
      product.images?.[0] || "https://via.placeholder.com/80";
    const productPrice = item.price || 0;
    const productQuantity = item.quantity || 1;

    return (
      <View style={styles.productRow}>
        <Image source={{ uri: productImage }} style={styles.productImage} />
        <View style={{ flex: 1 }}>
          <Text style={styles.productName} numberOfLines={2}>
            {productName}
          </Text>
          <Text style={styles.productPrice}>
            {productPrice.toLocaleString()}đ x {productQuantity}
          </Text>
        </View>
        {orderStatus === "DELIVERED" && (
          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={() => openFeedbackModal(product._id)}
          >
            <Text style={styles.feedbackButtonText}>Đánh giá</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  function renderOrderCard(order: any) {
    const statusVN = ORDER_STATUS_MAP[order.orderStatus] || order.orderStatus;
    const items = order.items || [];
    const totalPrice = order.totalPrice || 0;
    const totalItems = items.reduce(
      (sum: number, p: any) => sum + (p.quantity || 1),
      0
    );

    return (
      <View style={styles.orderCard}>
        {/* Trạng thái ở góc phải */}
        <View style={styles.headerRow}>
          <Text style={styles.statusText}>{statusVN}</Text>
        </View>

        {/* Danh sách sản phẩm trong đơn */}
        {items.map((item: any, idx: number) => (
          <View key={idx}>{renderOrderItem(item, order.orderStatus)}</View>
        ))}

        {/* Tổng số tiền */}
        <Text style={styles.totalText}>
          Tổng số tiền ({totalItems} sản phẩm): {totalPrice.toLocaleString()}đ
        </Text>

        {/* Nút hành động: chỉ hiển thị "Hủy đơn hàng" nếu PENDING */}
        <View style={styles.buttonRow}>
          {order.orderStatus === "PENDING" && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setSelectedOrderId(order._id);
                setShowCancelModal(true);
              }}
            >
              <Text style={styles.actionButtonText}>Hủy đơn hàng</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Bạn chưa đăng nhập</Text>
        <Text style={styles.subtitle}>
          Để xem và chỉnh sửa hồ sơ, vui lòng đăng nhập hoặc đăng ký.
        </Text>
        <TouchableOpacity style={styles.loginButton} onPress={handleGoLogin}>
          <Text style={styles.loginButtonText}>Đăng nhập</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signupButton} onPress={handleGoSignup}>
          <Text style={styles.signupButtonText}>Đăng ký</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER TABS */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.headerTab,
            activeTab === "profile" && styles.headerTabActive,
          ]}
          onPress={() => setActiveTab("profile")}
        >
          <Text
            style={[
              styles.headerTabText,
              activeTab === "profile" && styles.headerTabTextActive,
            ]}
          >
            Hồ sơ của bạn
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.headerTab,
            activeTab === "orders" && styles.headerTabActive,
          ]}
          onPress={() => setActiveTab("orders")}
        >
          <Text
            style={[
              styles.headerTabText,
              activeTab === "orders" && styles.headerTabTextActive,
            ]}
          >
            Đơn hàng của bạn
          </Text>
        </TouchableOpacity>
      </View>

      {/* NỘI DUNG THEO TAB */}
      {activeTab === "profile" ? (
        <View style={{ flex: 1 }}>
          {/* FORM CẬP NHẬT HỒ SƠ */}
          <TextInput
            style={styles.input}
            placeholder="Họ và tên"
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={[styles.input, { backgroundColor: "#ddd" }]}
            placeholder="Địa chỉ email"
            value={email}
            editable={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Số điện thoại"
            value={phone}
            onChangeText={setPhone}
          />
          <TextInput
            style={styles.input}
            placeholder="Địa chỉ"
            value={address}
            onChangeText={setAddress}
          />
          <TextInput
            style={styles.input}
            placeholder="Thành phố"
            value={city}
            onChangeText={setCity}
          />
          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdateProfile}
          >
            <Text style={styles.updateButtonText}>CẬP NHẬT</Text>
          </TouchableOpacity>

          {/* FORM ĐỔI MẬT KHẨU */}
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu cũ"
            secureTextEntry
            value={oldPassword}
            onChangeText={setOldPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu mới"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleChangePassword}
          >
            <Text style={styles.updateButtonText}>ĐỔI MẬT KHẨU</Text>
          </TouchableOpacity>

          {/* Nút đăng xuất */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {loadingOrders && page === 1 ? (
            <ActivityIndicator
              size="large"
              color="#2f95dc"
              style={{ margin: 20 }}
            />
          ) : (
            <FlatList
              data={orders}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => renderOrderCard(item)}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.1}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator
                    size="small"
                    color="#2f95dc"
                    style={{ margin: 10 }}
                  />
                ) : null
              }
              ListEmptyComponent={
                !loadingOrders && orders.length === 0 ? (
                  <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
                ) : null
              }
            />
          )}
        </View>
      )}

      {/* Modal xác nhận hủy đơn hàng */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xác nhận</Text>
            <Text style={{ textAlign: "center", marginVertical: 8 }}>
              Bạn có chắc muốn hủy đơn hàng này?
            </Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#ccc" }]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text>Không</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#2f95dc" }]}
                onPress={() => {
                  if (selectedOrderId) {
                    handleCancelOrder(selectedOrderId);
                  }
                  setShowCancelModal(false);
                }}
              >
                <Text style={{ color: "#fff" }}>Có</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* (**) Modal đánh giá sản phẩm */}
      <Modal
        visible={showFeedbackModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đánh giá sản phẩm</Text>
            <TextInput
              style={styles.input}
              placeholder="Điểm (1-5)"
              keyboardType="numeric"
              value={feedbackRating}
              onChangeText={setFeedbackRating}
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Nội dung đánh giá"
              multiline
              value={feedbackContent}
              onChangeText={setFeedbackContent}
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#ccc" }]}
                onPress={() => setShowFeedbackModal(false)}
              >
                <Text>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#2f95dc" }]}
                onPress={handleSubmitFeedback}
              >
                <Text style={{ color: "#fff" }}>Gửi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// STYLE
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    backgroundColor: "#2f95dc",
    justifyContent: "space-around",
    alignItems: "center",
    height: 50,
    marginBottom: 12,
  },
  headerTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerTabActive: {
    backgroundColor: "#1c7cb6",
    borderRadius: 8,
  },
  headerTabText: {
    color: "#fff",
    fontSize: 16,
  },
  headerTabTextActive: {
    fontWeight: "bold",
  },

  title: {
    marginTop: 20,
    fontSize: 20,
    marginBottom: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginHorizontal: 12,
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  loginButton: {
    backgroundColor: "#2f95dc",
    padding: 12,
    borderRadius: 4,
    marginBottom: 10,
    marginHorizontal: 12,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  signupButton: {
    backgroundColor: "#fff",
    borderColor: "#2f95dc",
    borderWidth: 1,
    padding: 12,
    borderRadius: 4,
    marginHorizontal: 12,
    alignItems: "center",
  },
  signupButtonText: {
    color: "#2f95dc",
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: "#2f95dc",
    padding: 12,
    borderRadius: 4,
    marginBottom: 10,
    alignItems: "center",
    marginHorizontal: 12,
  },
  updateButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#fff",
    borderColor: "#2f95dc",
    borderWidth: 1,
    padding: 12,
    borderRadius: 4,
    marginHorizontal: 12,
    alignItems: "center",
    marginTop: 10,
  },
  logoutButtonText: {
    color: "#2f95dc",
    fontSize: 16,
  },

  // =========== ORDER CARD STYLE ===========
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 12,
    // Shadow
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerRow: {
    width: "100%",
    marginBottom: 8,
  },
  statusText: {
    marginLeft: "auto",
    color: "#999",
    fontWeight: "500",
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
    color: "#333",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productPrice: {
    color: "#e74c3c",
    fontWeight: "600",
  },
  seeMoreText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
    marginLeft: 4,
  },
  totalText: {
    alignSelf: "flex-end",
    fontSize: 14,
    marginBottom: 8,
    color: "#333",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    borderWidth: 1,
    borderColor: "#2f95dc",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  actionButtonText: {
    color: "#2f95dc",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 10,
  },

  // (**) Thêm nút "Đánh giá"
  feedbackButton: {
    backgroundColor: "#FFFF66",
    borderRadius: 4,
    padding: 6,
    marginLeft: "auto",
  },
  feedbackButtonText: {
    color: "#333",
    fontSize: 13,
    fontWeight: "500",
  },
});
