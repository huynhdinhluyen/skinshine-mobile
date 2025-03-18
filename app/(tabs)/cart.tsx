import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ToastAndroid,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { FontAwesome } from "@expo/vector-icons";
import { useCart } from "@/context/CartContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type Product = {
  _id: string;
  name: string;
  images: string[];
  price: number;
  stockQuantity: number;
  promotionId?: string | null;
  originalPrice: number;
  discountedPrice: number;
};

type CartItem = {
  _id: string;
  product: Product;
  quantity: number;
};

export default function CartScreen() {
  const { user } = useAuth();
  const { cart, fetchCartFromServer } = useCart();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.token) {
      setLoading(false);
      return;
    }
    fetchCartData();
  }, []);

  const fetchCartData = async () => {
    setLoading(true);
    if (user?.id && user?.token) {
      await fetchCartFromServer(user!.id, user!.token);
    }
    setLoading(false);
    setSelectedIds([]);
  };

  const handleToggleSelect = (item: CartItem) => {
    setSelectedIds((prev) =>
      prev.includes(item._id)
        ? prev.filter((id) => id !== item._id)
        : [...prev, item._id]
    );
  };

  const handleSelectAll = () => {
    if (!cart) return;
    if (selectedIds.length === cart.items.length) {
      setSelectedIds([]);
    } else {
      const allIds = cart.items.map((item) => item._id);
      setSelectedIds(allIds);
    }
  };

  const handleDeleteItem = (item: CartItem) => {
    Alert.alert(
      "Xóa sản phẩm",
      `Bạn có chắc chắn muốn xóa "${item.product.name}" khỏi giỏ hàng?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => doDeleteItem(item),
        },
      ]
    );
  };

  const doDeleteItem = async (item: CartItem) => {
    try {
      const response = await fetch(
        `${API_URL}/carts/${user?.id}/items/${item.product._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );
      if (!response.ok) {
        ToastAndroid.show("Có lỗi khi xóa sản phẩm!", ToastAndroid.SHORT);
        return;
      }
      ToastAndroid.show("Đã xóa sản phẩm!", ToastAndroid.SHORT);

      if (user?.id && user?.token) {
        await fetchCartFromServer(user.id, user.token);
      }
      setSelectedIds((prev) => prev.filter((id) => id !== item._id));
    } catch (error) {
      console.error("Error deleting cart item:", error);
      ToastAndroid.show("Đã xảy ra lỗi!", ToastAndroid.SHORT);
    }
  };

  const handleUpdateQuantity = async (item: CartItem, newQty: number) => {
    if (newQty < 1) {
      return handleDeleteItem(item);
    }
    if (newQty > item.product.stockQuantity) {
      ToastAndroid.show("Vượt quá số lượng tồn kho!", ToastAndroid.SHORT);
      return;
    }
    try {
      const response = await fetch(
        `${API_URL}/carts/${user?.id}/items/${item.product._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify({ quantity: newQty }),
        }
      );
      if (!response.ok) {
        ToastAndroid.show("Có lỗi khi cập nhật số lượng!", ToastAndroid.SHORT);
        return;
      }
      ToastAndroid.show("Cập nhật số lượng thành công!", ToastAndroid.SHORT);

      if (user?.id && user?.token) {
        await fetchCartFromServer(user.id, user.token);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      ToastAndroid.show("Đã xảy ra lỗi!", ToastAndroid.SHORT);
    }
  };

  const handlePlaceOrder = () => {
    if (!cart || !user?.token) return;
    if (selectedIds.length === 0) {
      Alert.alert("Chú ý", "Vui lòng chọn ít nhất một sản phẩm để đặt hàng!");
      return;
    }
    const selectedItems = cart.items.filter((item) =>
      selectedIds.includes(item._id)
    );

    const orderData = {
      userId: user.id,
      items: selectedItems.map((item) => ({
        productId: item.product._id,
        productName: item.product.name,
        quantity: item.quantity,
        image: item.product.images[0],
        price: item.product.price,
      })),
      totalQuantity: selectedItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
      shippingFee: 50000,
      discount: 0,
      totalPrice:
        selectedItems.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        ) + 50000,
    };

    const orderDataStr = encodeURIComponent(JSON.stringify(orderData));
    const orderPath: `/payment?data=${string}` = `/payment?data=${orderDataStr}`;
    router.push(orderPath);
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const isSelected = selectedIds.includes(item._id);
    return (
      <View style={styles.itemContainer}>
        {/* Checkbox */}
        <TouchableOpacity
          style={styles.checkBox}
          onPress={() => handleToggleSelect(item)}
        >
          <FontAwesome
            name={isSelected ? "check-square" : "square-o"}
            size={20}
            color={isSelected ? "#2f95dc" : "#888"}
          />
        </TouchableOpacity>

        {/* Ảnh + thông tin */}
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => router.push(`/product/${item.product._id}`)}
        >
          <View style={styles.row}>
            <Image
              source={{
                uri:
                  item.product.images?.[0] || "https://via.placeholder.com/80",
              }}
              style={styles.productImage}
            />
            <View style={styles.infoContainer}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text>Giá: {item.product.price.toLocaleString()}đ</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* +/- */}
        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => handleUpdateQuantity(item, item.quantity - 1)}
          >
            <FontAwesome name="minus" size={16} color="#333" />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => handleUpdateQuantity(item, item.quantity + 1)}
          >
            <FontAwesome name="plus" size={16} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Xóa */}
        <TouchableOpacity
          style={styles.closeIcon}
          onPress={() => handleDeleteItem(item)}
        >
          <FontAwesome name="times" size={18} color="#ff4757" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2f95dc" />
      </SafeAreaView>
    );
  }

  if (!user?.token) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.loginMessage}>
          Bạn chưa đăng nhập. Vui lòng đăng nhập để xem giỏ hàng.
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f0f0f0" }}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <FontAwesome name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Giỏ hàng của bạn</Text>
        </View>
        <View style={styles.container}>
          <Text
            style={{
              margin: "auto"
            }}
          >
            Giỏ hàng trống đang trống
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const allSelected = selectedIds.length === cart.items.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f0f0f0" }}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng của bạn</Text>
      </View>

      {/* Nội dung */}
      <View style={styles.container}>
        {/* Nút Chọn tất cả */}
        <View style={styles.selectAllRow}>
          <TouchableOpacity
            onPress={handleSelectAll}
            style={styles.selectAllButton}
          >
            <FontAwesome
              name={allSelected ? "check-square" : "square-o"}
              size={20}
              color={allSelected ? "#2f95dc" : "#888"}
            />
            <Text style={styles.selectAllText}>Chọn tất cả</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={cart.items}
          keyExtractor={(item) => item._id}
          renderItem={renderCartItem}
          style={styles.list}
        />

        <View style={styles.footer}>
          <Text style={styles.totalText}>
            Tổng tiền: {cart.totalPrice.toLocaleString()}đ
          </Text>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handlePlaceOrder}
          >
            <Text style={styles.checkoutButtonText}>Tiến hành đặt hàng</Text>
            <FontAwesome name="angle-right" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    backgroundColor: "#2f95dc",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButton: { position: "absolute", left: 16, padding: 8 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#fff",
  },
  loginMessage: { fontSize: 16, marginBottom: 12 },
  loginButton: {
    backgroundColor: "#2f95dc",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  selectAllRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  selectAllButton: { flexDirection: "row", alignItems: "center" },
  selectAllText: { marginLeft: 8, fontSize: 16, color: "#333" },
  list: { flex: 1 },
  itemContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkBox: { marginRight: 8, padding: 4 },
  row: { flexDirection: "row", alignItems: "center", flex: 1 },
  productImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  infoContainer: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  quantityRow: { flexDirection: "row", alignItems: "center" },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "500",
    marginHorizontal: 5,
    minWidth: 20,
    textAlign: "center",
  },
  closeIcon: { paddingHorizontal: 8, paddingVertical: 8 },
  footer: { paddingVertical: 16, borderTopWidth: 1, borderTopColor: "#eee" },
  totalText: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
  checkoutButton: {
    flexDirection: "row",
    backgroundColor: "#2f95dc",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
});
