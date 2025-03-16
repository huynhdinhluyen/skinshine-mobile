import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getProductById } from "@/services/product.service";
import { Product } from "@/types/product/product";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
// Tính toán chiều rộng card cho tối đa 3 cột
const cardWidth = (width - 40) / 3;

export default function CompareScreen() {
  const { product1, product2, product3 } = useLocalSearchParams<{
    product1: string;
    product2?: string;
    product3?: string;
  }>();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const productIds = [product1, product2, product3].filter(
      Boolean
    ) as string[];

    if (productIds.length < 2) {
      // Không đủ 2 sản phẩm để so sánh
      setLoading(false);
      return;
    }

    Promise.all(productIds.map((id) => getProductById(id)))
      .then((results) => {
        // Lọc ra các sản phẩm hợp lệ (không null)
        const validProducts = results.filter(Boolean) as Product[];
        setProducts(validProducts);
      })
      .catch((error) => console.error("Error fetching compare details:", error))
      .finally(() => setLoading(false));
  }, [product1, product2, product3]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2f95dc" />
      </View>
    );
  }

  if (products.length < 2) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Cần ít nhất 2 sản phẩm để so sánh.</Text>
      </View>
    );
  }

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/home");
    }
  };

  const isTwoProducts = products.length === 2;

  const detailKeys = [
    { label: "Thương hiệu:", key: "brand" },
    { label: "Xuất sứ:", key: "origin" },
    { label: "Dung tích (ml):", key: "capacity" },
    { label: "Giá (VNĐ):", key: "price" },
    { label: "Đã bán:", key: "sold" },
    { label: "Đánh giá:", key: "rating" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>So sánh</Text>
      </View>

      <View style={{ padding: 20 }}>
        <View style={[styles.compareRow, isTwoProducts && styles.twoColumns]}>
          {products.map((product) => (
            <View key={product._id} style={styles.card}>
              <Image
                source={{
                  uri: product.images[0] || "https://via.placeholder.com/150",
                }}
                style={styles.productImage}
                resizeMode="cover"
              />
              <Text
                style={styles.productName}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {product.name}
              </Text>
              <Text style={styles.productBrand}>{product.brand}</Text>
              <Text style={styles.productPrice}>
                {Number(product.price).toLocaleString("vi-VN")}đ
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.detailContainer}>
          {detailKeys.map((item) => (
            <View key={item.key} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              {products.map((p) => {
                const key = item.key as keyof Product;
                const rawValue = p[key];
                let displayValue: string;

                if (rawValue !== undefined && rawValue !== null) {
                  if (item.key === "price") {
                    const numeric = Number(rawValue);
                    displayValue = numeric.toLocaleString("vi-VN");
                  } else {
                    displayValue = String(rawValue);
                  }
                } else {
                  displayValue = "chưa có";
                }

                return (
                  <View key={p._id} style={styles.detailValueWrapper}>
                    <Text style={styles.detailValueText}>{displayValue}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  header: {
    backgroundColor: "#2f95dc",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 12,
  },
  backButton: {
    position: "absolute",
    left: 10,
    top: 13,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
  },
  compareRow: {
    flexDirection: "row",
    justifyContent: "space-between", 
  },
  twoColumns: {
    justifyContent: "space-evenly", 
  },
  card: {
    width: cardWidth,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  productImage: {
    width: cardWidth - 20,
    height: cardWidth - 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 5,
  },
  productBrand: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2f95dc",
  },

  detailContainer: {
    marginTop: 30,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  detailLabel: {
    width: 120,
    fontWeight: "600",
    color: "#333",
  },
  detailValueWrapper: {
    flex: 1,
    maxWidth: 100,
    paddingRight: 8,
  },
  detailValueText: {
    textAlign: "center",
    color: "#555",
    flexWrap: "wrap",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
});
