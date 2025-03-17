import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  ToastAndroid,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type Product = {
  _id: string;
  name: string;
  image: string;
  price: number;
};

export type OrderItem = {
  productName: string;
  image: string | undefined;
  _id?: string;
  productId?: Product;
  quantity?: number;
  price?: number;
  subTotal?: number;
};

export type Order = {
  _id?: string;
  user?: string;
  items?: OrderItem[];
  totalQuantity?: number;
  totalPrice?: number;
  discount?: number;
  shippingFee?: number;
  orderStatus?: string;
};

export default function PaymentScreen() {
  const { data } = useLocalSearchParams<{ data?: string }>();
  const router = useRouter();
  const { user, setUser } = useAuth(); 
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { fetchCartFromServer, cart } = useCart();

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  useEffect(() => {
    if (data) {
      try {
        const decoded = decodeURIComponent(data);
        const parsedOrder = JSON.parse(decoded) as Order;
        setOrder(parsedOrder);
      } catch (error) {
        console.error("Error parsing order data:", error);
        ToastAndroid.show("Lỗi dữ liệu đơn hàng!", ToastAndroid.SHORT);
      } finally {
        setLoading(false);
      }
    } else {
      ToastAndroid.show("Không có dữ liệu đơn hàng!", ToastAndroid.SHORT);
      setLoading(false);
    }
  }, [data]);

  const renderOrderItem = ({ item }: { item: OrderItem }) => {
    if (!item.productId) {
      return (
        <View style={styles.itemContainer}>
          <Text style={{ color: "red" }}>Thiếu productId!</Text>
        </View>
      );
    }
    return (
      <View style={styles.itemContainer}>
        <Image
          source={{
            uri: item.image,
          }}
          style={styles.productImage}
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.productName}</Text>
          <Text>Số lượng: {item.quantity ?? 0}</Text>
          <Text>Giá: {(item.price ?? 0).toLocaleString()}đ</Text>
        </View>
      </View>
    );
  };

  const handleSaveAddress = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/auth/${user.id}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          fullName,
          city,
          address,
          phone,
        }),
      });
      if (!response.ok) {
        ToastAndroid.show("Có lỗi khi cập nhật địa chỉ!", ToastAndroid.SHORT);
        return;
      }
      const updatedUser = { ...user, fullName, city, address, phone };
      setUser(updatedUser);
      ToastAndroid.show("Cập nhật địa chỉ thành công!", ToastAndroid.SHORT);
      setShowAddressModal(false);
    } catch (error) {
      console.error("Error updating address:", error);
      ToastAndroid.show("Đã xảy ra lỗi!", ToastAndroid.SHORT);
    }
  };

  const handlePlaceOrder = async () => {
    if (!order || !user?.token) return;
    if (!user.address || !user.city || !user.phone) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng cập nhật địa chỉ, thành phố, số điện thoại!"
      );
      return;
    }
    try {
      const bodyData = {
        userId: user.id,
        items: order.items?.map((it) => ({
          productId: it.productId,
          quantity: it.quantity ?? 1,
        })),
        paymentMethod: "COD",
        shippingFee: order.shippingFee ?? 0,
        discount: order.discount ?? 0,
        shippingAddress: {
          addressLine1: user.address,
          city: user.city,
          phone: user.phone,
        },
      };

      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(bodyData),
      });
      if (!response.ok) {
        ToastAndroid.show("Lỗi khi tạo đơn hàng!", ToastAndroid.SHORT);
        return;
      }
      const json = await response.json();
      ToastAndroid.show("Đặt hàng thành công!", ToastAndroid.SHORT);

      if (order.items) {
        order.items.map(async (item) => {
          if (item.productId) {
            const deleteResponse = await fetch(
              `${API_URL}/carts/${user?.id}/items/${item.productId}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${user?.token}`,
                },
              }
            );
            if (!deleteResponse.ok) {
              console.log(
                "Lỗi khi xóa sản phẩm khỏi giỏ hàng:",
                item.productId._id
              );
            }
          }
        });
      }
      await fetchCartFromServer(user.id, user.token);
      router.push("/order/success");
    } catch (error) {
      console.error("Error placing order:", error);
      ToastAndroid.show("Đã xảy ra lỗi!", ToastAndroid.SHORT);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2f95dc" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Không tìm thấy đơn hàng!</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => router.back()}
            >
              <FontAwesome name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
          ),
          headerTitle: () => <Text style={styles.headerTitle}>Thanh toán</Text>,
          headerStyle: { backgroundColor: "#f0f0f0" },
        }}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.addressBox}>
          <Text style={styles.addressTitle}>Địa chỉ giao hàng</Text>
          {!user?.address || !user?.city ? (
            <View>
              <Text>Chưa có địa chỉ</Text>
              <TouchableOpacity
                style={styles.updateAddressButton}
                onPress={() => {
                  setFullName(user?.fullName ?? "");
                  setCity(user?.city ?? "");
                  setAddress(user?.address ?? "");
                  setPhone(user?.phone ?? "");
                  setShowAddressModal(true);
                }}
              >
                <Text style={styles.updateAddressText}>Cập nhật địa chỉ</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text>{user.fullName}</Text>
              <Text>Địa chỉ: {user.address}</Text>
              <Text>Thành phố: {user.city}</Text>
              <Text>Điện thoại: {user.phone}</Text>
              <TouchableOpacity
                style={styles.updateAddressButton}
                onPress={() => {
                  setFullName(user?.fullName ?? "");
                  setCity(user?.city ?? "");
                  setAddress(user?.address ?? "");
                  setPhone(user?.phone ?? "");
                  setShowAddressModal(true);
                }}
              >
                <Text style={styles.updateAddressText}>Sửa địa chỉ</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Sản phẩm đã đặt</Text>
        <FlatList
          data={order.items}
          keyExtractor={(item, index) => item._id ?? String(index)}
          renderItem={renderOrderItem}
          style={styles.list}
        />

        {/* Chi tiết thanh toán */}
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>Chi tiết thanh toán</Text>
          <Text>Tổng số lượng: {order.totalQuantity ?? 0}</Text>
          <Text>Giảm giá: {(order.discount ?? 0).toLocaleString()}đ</Text>
          <Text>
            Phí giao hàng: {(order.shippingFee ?? 0).toLocaleString()}đ
          </Text>
          <Text>Tổng tiền: {(order.totalPrice ?? 0).toLocaleString()}đ</Text>
        </View>

        <TouchableOpacity
          style={styles.placeOrderButton}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.placeOrderText}>Đặt hàng</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <Modal visible={showAddressModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cập nhật địa chỉ</Text>
            <TextInput
              style={styles.input}
              placeholder="Họ tên"
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              style={styles.input}
              placeholder="Thành phố"
              value={city}
              onChangeText={setCity}
            />
            <TextInput
              style={styles.input}
              placeholder="Địa chỉ"
              value={address}
              onChangeText={setAddress}
            />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#ccc" }]}
                onPress={() => setShowAddressModal(false)}
              >
                <Text>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#2f95dc" }]}
                onPress={handleSaveAddress}
              >
                <Text style={{ color: "#fff" }}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerBackButton: {
    marginLeft: 15,
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  addressBox: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  updateAddressButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#2f95dc",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  updateAddressText: {
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  list: {
    flex: 1,
    marginBottom: 16,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  paymentInfo: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  placeOrderButton: {
    backgroundColor: "#2f95dc",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  placeOrderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginLeft: 10,
  },
});
