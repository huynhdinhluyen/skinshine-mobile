import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions, Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { getProductById } from "@/services/product.service";
import { Product } from "@/types/product/product";
import { Ionicons, MaterialCommunityIcons, FontAwesome } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function CompareScreen() {
  const { product1, product2 } = useLocalSearchParams<{
    product1: string;
    product2: string;
  }>();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const productIds = [product1, product2].filter(Boolean) as string[];

    if (productIds.length !== 2) {
      // Need exactly 2 products to compare
      setLoading(false);
      return;
    }

    Promise.all(productIds.map((id) => getProductById(id)))
        .then((results) => {
          // Filter out any null results
          const validProducts = results.filter(Boolean) as Product[];
          setProducts(validProducts);
        })
        .catch((error) => console.error("Error fetching compare details:", error))
        .finally(() => setLoading(false));
  }, [product1, product2]);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/home");
    }
  };

  if (loading) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2f95dc" />
        </View>
    );
  }

  if (products.length !== 2) {
    return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Cần đúng 2 sản phẩm để so sánh.</Text>
          <TouchableOpacity
              style={styles.backToHomeButton}
              onPress={() => router.replace("/(tabs)/home")}
          >
            <Text style={styles.backToHomeText}>Quay về trang chủ</Text>
          </TouchableOpacity>
        </View>
    );
  }

  // Prepare comparison details
  const comparisonDetails = [
    { label: "Thương hiệu", key: "brand", icon: "tag" },
    { label: "Loại da phù hợp", key: "skinTypes", icon: "smile-o"},
    { label: "Xuất xứ", key: "origin", icon: "flag" },
    { label: "Dung tích", key: "capacity", icon: "tint", suffix: "ml" },
    { label: "Số lượng đã bán", key: "sold", icon: "shopping-bag" },
    { label: "Đánh giá", key: "averageRating", icon: "star", suffix: `(${products[0].reviewCount}/${products[1].reviewCount})` },
    { label: "Giảm giá", key: "discountedPrice", icon: "money",
      getValue: (p: Product) =>
          p.discountedPrice < p.originalPrice ?
              `${Math.round((p.originalPrice - p.discountedPrice) / p.originalPrice * 100)}%` :
              "Không"
    },
  ];

  return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView style={styles.container}>
          {/* Custom Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>So sánh sản phẩm</Text>
            <View style={{ width: 30 }} />
          </View>

          {/* Products Overview */}
          <View style={styles.productsOverview}>
            {products.map((product, index) => (
                <View key={product._id} style={styles.productCard}>
                  <Image
                      source={{
                        uri: product.images[0] || "https://via.placeholder.com/150",
                      }}
                      style={styles.productImage}
                      resizeMode="cover"
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productBrand}>{product.brand}</Text>
                    <Text
                        style={styles.productName}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                    >
                      {product.name}
                    </Text>
                    <View style={styles.priceContainer}>
                      {product.discountedPrice < product.originalPrice ? (
                          <>
                            <Text style={styles.originalPrice}>
                              {product.originalPrice.toLocaleString()}đ
                            </Text>
                            <Text style={styles.discountedPrice}>
                              {product.discountedPrice.toLocaleString()}đ
                            </Text>
                          </>
                      ) : (
                          <Text style={styles.price}>
                            {product.price.toLocaleString()}đ
                          </Text>
                      )}
                    </View>
                    <TouchableOpacity
                        style={styles.viewDetailButton}
                        onPress={() => router.push(`/product/${product._id}`)}
                    >
                      <Text style={styles.viewDetailText}>Chi tiết</Text>
                    </TouchableOpacity>
                  </View>
                </View>
            ))}
          </View>

          {/* Comparison Sections */}
          <View style={styles.comparisonSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="information" size={20} color="#2f95dc" />
              <Text style={styles.sectionTitle}>Thông tin chung</Text>
            </View>

            {comparisonDetails.map((detail, index) => (
                <View key={index} style={styles.comparisonRow}>
                  <View style={styles.labelColumn}>
                    <FontAwesome name={detail.icon as any} size={16} color="#666" style={styles.labelIcon} />
                    <Text style={styles.labelText}>{detail.label}</Text>
                  </View>

                  {products.map((product) => {
                    let displayValue;

                    if (detail.getValue) {
                      displayValue = detail.getValue(product);
                    } else {
                      const rawValue = product[detail.key as keyof Product];

                      if (Array.isArray(rawValue)) {
                        displayValue = rawValue.join(", ");
                      } else if (rawValue !== undefined && rawValue !== null) {
                        displayValue = String(rawValue);
                        if (detail.key === "discountedPrice" || detail.key === "originalPrice" || detail.key === "price") {
                          displayValue = Number(rawValue).toLocaleString() + "đ";
                        }
                      } else {
                        displayValue = "—";
                      }

                      if (detail.suffix) {
                        displayValue += " " + detail.suffix;
                      }
                    }

                    return (
                        <View key={product._id} style={styles.valueColumn}>
                          <Text style={styles.valueText}>{displayValue}</Text>
                        </View>
                    );
                  })}
                </View>
            ))}
          </View>

          {/* Ingredients Section */}
          <View style={styles.comparisonSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="flask" size={20} color="#2f95dc" />
              <Text style={styles.sectionTitle}>Thành phần</Text>
            </View>

            <View style={styles.ingredientsContainer}>
              {products.map((product) => (
                  <View key={product._id} style={styles.ingredientColumn}>
                    <Text style={styles.productColumnTitle}>{product.name}</Text>
                    <Text style={styles.ingredientsText}>
                      {product.ingredients || "Không có thông tin thành phần"}
                    </Text>
                  </View>
              ))}
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.comparisonSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="text-box" size={20} color="#2f95dc" />
              <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
            </View>

            <View style={styles.descriptionContainer}>
              {products.map((product) => (
                  <View key={product._id} style={styles.descriptionColumn}>
                    <Text style={styles.productColumnTitle}>{product.name}</Text>
                    <Text style={styles.descriptionText}>
                      {product.description || "Không có mô tả"}
                    </Text>
                  </View>
              ))}
            </View>
          </View>

          {/* Footer space */}
          <View style={{height: 40}} />
        </ScrollView>
      </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    backgroundColor: "#2f95dc",
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: Platform.OS === "ios" ? 20 : 0,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
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
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  backToHomeButton: {
    backgroundColor: "#2f95dc",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  backToHomeText: {
    color: "#fff",
    fontWeight: "600",
  },
  productsOverview: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  productCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  productImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#f0f0f0",
  },
  productInfo: {
    padding: 10,
  },
  productBrand: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  priceContainer: {
    marginBottom: 10,
  },
  originalPrice: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E53935",
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E53935",
  },
  viewDetailButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignItems: "center",
  },
  viewDetailText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  comparisonSection: {
    backgroundColor: "#fff",
    marginTop: 15,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  comparisonRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 12,
  },
  labelColumn: {
    width: "30%",
    flexDirection: "row",
    alignItems: "center",
  },
  labelIcon: {
    marginRight: 8,
  },
  labelText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  valueColumn: {
    width: "35%",
    justifyContent: "center",
  },
  valueText: {
    fontSize: 14,
    color: "#333",
  },
  ingredientsContainer: {
    flexDirection: "row",
  },
  ingredientColumn: {
    flex: 1,
    padding: 8,
  },
  productColumnTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  ingredientsText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },
  descriptionContainer: {
    flexDirection: "row",
  },
  descriptionColumn: {
    flex: 1,
    padding: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },
});