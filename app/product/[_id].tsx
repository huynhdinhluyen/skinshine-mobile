import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Share,
  Platform,
  Modal,
  TextInput,
  FlatList,
  ToastAndroid,
} from "react-native";
import { Text, View } from "@/components/Themed";
import { FontAwesome } from "@expo/vector-icons";
import {
  useLocalSearchParams,
  useRouter,
  Stack,
  useFocusEffect,
} from "expo-router";
import {
  getProductById,
  getProducts,
  ProductQueryParams,
} from "@/services/product.service";
import { Product } from "@/types/product/product";
import { useAuth } from "@/context/AuthContext";

// Import CartContext
import { useCart } from "@/context/CartContext";
import { CartIconWithBadge } from "@/components/CartIconWithBadge";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { _id } = useLocalSearchParams<{ _id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const { user } = useAuth();

  // Các state và logic so sánh sản phẩm
  const [isCompareModalVisible, setIsCompareModalVisible] = useState(false);
  const [comparisonProducts, setComparisonProducts] = useState<
    (Product | null)[]
  >([null, null]);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  // Lấy hàm getCartCount từ CartContext
  const { getCartCount, fetchCartFromServer } = useCart();

  useEffect(() => {
    fetchProductDetails();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [_id]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchProductDetails = async () => {
    try {
      if (!_id) return;
      const data = await getProductById(_id);
      setProduct(data);
    } catch (error) {
      console.error("Error fetching product details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      if (!product) return;

      const token = user?.token;

      const response = await fetch(`${API_URL}/carts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?.id,
          productId: product._id,
          quantity: quantity,
        }),
      });

      if (response.status === 401) {
        ToastAndroid.show(
          "Vui lòng đăng nhập trước khi thêm vào giỏ hàng!",
          ToastAndroid.SHORT
        );
        return;
      }

      if (response.ok) {
        ToastAndroid.show("Đã thêm vào giỏ hàng!", ToastAndroid.SHORT);
        if (user?.id && user.token) {
          fetchCartFromServer(user?.id, user?.token);
        }
      } else {
        console.log(response);
        ToastAndroid.show("Lỗi khi thêm vào giỏ hàng!", ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      ToastAndroid.show("Đã xảy ra lỗi!", ToastAndroid.SHORT);
    }
  };

  const handleQuantityChange = (amount: number) => {
    const newQuantity = quantity + amount;
    if (newQuantity > 0 && newQuantity <= (product?.stockQuantity || 10)) {
      setQuantity(newQuantity);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `Check out ${product.name} by ${product.brand} - A great skincare product!`,
        url: product.images[0],
        title: product.name,
      });
    } catch (error) {
      console.error("Error sharing product:", error);
    }
  };

  const handleOpenCompareModal = () => {
    setIsCompareModalVisible(true);
    setEditingSlot(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleCloseCompareModal = () => {
    setIsCompareModalVisible(false);
    setEditingSlot(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleEditSlot = (slotIndex: number) => {
    setEditingSlot(slotIndex);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSearch = async () => {
    try {
      const params: ProductQueryParams = { search: searchQuery };
      const results = await getProducts(params);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching products:", error);
    }
  };

  const handleChooseComparisonProduct = (item: Product) => {
    if (editingSlot !== null) {
      const newComparisons = [...comparisonProducts];
      newComparisons[editingSlot] = item;
      setComparisonProducts(newComparisons);
      setEditingSlot(null);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  const handleCompare = () => {
    if (product) {
      const params: { [key: string]: string } = { product1: product._id };
      comparisonProducts.forEach((prod, index) => {
        if (prod) {
          params[`product${index + 2}`] = prod._id;
        }
      });
      if (Object.keys(params).length < 2) {
        alert("Vui lòng chọn ít nhất 1 sản phẩm để so sánh.");
        return;
      }
      router.push({ pathname: "/compare", params });
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setIsCompareModalVisible(false);
      setComparisonProducts([null, null]);
      setEditingSlot(null);
      setSearchQuery("");
      setSearchResults([]);
      return () => {};
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2f95dc" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerTransparent: true,
          headerBackTitle: "",
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity
              style={styles.backButtonHeader}
              onPress={() => router.back()}
            >
              <FontAwesome name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={toggleFavorite}
              >
                <FontAwesome
                  name={isFavorite ? "heart" : "heart-o"}
                  size={22}
                  color={isFavorite ? "#ff4757" : "#fff"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push("/(tabs)/cart")}
              >
                <CartIconWithBadge
                  iconName="shopping-cart"
                  iconSize={22}
                  iconColor="#fff"
                  badgeCount={getCartCount()}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleShare}
              >
                <FontAwesome name="share" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Product Images */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            const x = event.nativeEvent.contentOffset.x;
            setCurrentImage(Math.round(x / width));
          }}
          scrollEventThrottle={16}
        >
          {product.images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image || "https://via.placeholder.com/400" }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        {/* Image Pagination Dots */}
        {product.images.length > 1 && (
          <View style={styles.pagination}>
            {product.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentImage && styles.activeDot,
                ]}
              />
            ))}
          </View>
        )}

        {/* Product Info */}
        <Animated.View
          style={[
            styles.infoContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.brand}>{product.brand}</Text>
              <Text style={styles.name}>{product.name}</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <FontAwesome
                    key={star}
                    name="star"
                    size={16}
                    color={star <= 4 ? "#FFB800" : "#e0e0e0"}
                    style={styles.starIcon}
                  />
                ))}
                <Text style={styles.reviewCount}>(42 reviews)</Text>
                <TouchableOpacity onPress={handleOpenCompareModal}>
                  <Text style={styles.compareText}>So sánh sản phẩm</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.headerRight}>
              {product.discountedPrice < product.originalPrice ? (
                <>
                  <Text style={styles.originalPrice}>
                    {product.originalPrice.toLocaleString()}đ
                  </Text>
                  <Text style={styles.price}>
                    {product.discountedPrice.toLocaleString()}đ
                  </Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                      {Math.round(
                        (1 - product.discountedPrice / product.originalPrice) *
                          100
                      )}
                      % OFF
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={styles.price}>
                  {product.price.toLocaleString()}đ
                </Text>
              )}
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <FontAwesome
                  name="flask"
                  size={18}
                  color="#666"
                  style={styles.detailIcon}
                />
                <Text style={styles.detailText}>{product.capacity}ml</Text>
              </View>
              <View style={styles.detailItem}>
                <FontAwesome
                  name="map-marker"
                  size={18}
                  color="#666"
                  style={styles.detailIcon}
                />
                <Text style={styles.detailText}>{product.origin}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <FontAwesome
                  name="tag"
                  size={18}
                  color="#666"
                  style={styles.detailIcon}
                />
                <Text style={styles.detailText}>
                  {product.category?.name ?? "No category"}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <FontAwesome
                  name="shopping-basket"
                  size={18}
                  color="#666"
                  style={styles.detailIcon}
                />
                <Text style={styles.detailText}>
                  {product.stockQuantity > 0
                    ? `${product.stockQuantity} in stock`
                    : "Out of stock"}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
          <View style={styles.keyFeaturesContainer}>
            <Text style={styles.sectionTitle}>Key Benefits</Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIconContainer}>
                  <FontAwesome name="check-circle" size={20} color="#2f95dc" />
                </View>
                <Text style={styles.benefitText}>
                  Hydrates skin for up to 48 hours
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIconContainer}>
                  <FontAwesome name="check-circle" size={20} color="#2f95dc" />
                </View>
                <Text style={styles.benefitText}>
                  Reduces appearance of fine lines
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIconContainer}>
                  <FontAwesome name="check-circle" size={20} color="#2f95dc" />
                </View>
                <Text style={styles.benefitText}>
                  Suitable for sensitive skin
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.howToUseContainer}>
            <Text style={styles.sectionTitle}>How to Use</Text>
            <Text style={styles.howToUseText}>
              Apply to clean skin morning and evening. Use a pea-sized amount
              and gently massage into the skin using upward motions. Allow to
              absorb completely before applying other products.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
      {/* Add to Cart Button */}
      <View style={styles.footer}>
        <View style={styles.quantitySelector}>
          <TouchableOpacity
            style={[
              styles.quantityButton,
              quantity <= 1 && styles.disabledButton,
            ]}
            onPress={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            style={[
              styles.quantityButton,
              quantity >= (product?.stockQuantity || 10) &&
                styles.disabledButton,
            ]}
            onPress={() => handleQuantityChange(1)}
            disabled={quantity >= (product?.stockQuantity || 10)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <FontAwesome
            name="shopping-cart"
            size={18}
            color="#fff"
            style={styles.cartIcon}
          />
          <Text style={styles.addToCartText}>Thêm vào giỏ hàng</Text>
        </TouchableOpacity>
      </View>
      {/* Modal So sánh sản phẩm */}
      <Modal transparent animationType="slide" visible={isCompareModalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>So sánh sản phẩm</Text>
            <ScrollView
              horizontal
              contentContainerStyle={styles.compareSlotsContainer}
            >
              <View style={styles.compareSlot}>
                <Text style={styles.slotTitle}>Sản phẩm hiện tại</Text>
                <Image
                  source={{
                    uri: product.images[0] || "https://via.placeholder.com/80",
                  }}
                  style={styles.compareImage}
                  resizeMode="cover"
                />
                <Text
                  style={styles.slotName}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {product.name}
                </Text>
              </View>
              {comparisonProducts.map((comp, index) => (
                <View key={index} style={styles.compareSlot}>
                  <Text style={styles.slotTitle}>Sản phẩm {index + 2}</Text>
                  {editingSlot === index ? (
                    <View style={styles.searchContainer}>
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Nhập tên sản phẩm"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                      <FlatList
                        data={searchResults}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={styles.searchResultItem}
                            onPress={() => handleChooseComparisonProduct(item)}
                          >
                            <Text numberOfLines={2} ellipsizeMode="tail">
                              {item.name}
                            </Text>
                          </TouchableOpacity>
                        )}
                        style={styles.searchResultsContainer}
                      />
                    </View>
                  ) : comp ? (
                    <>
                      <Image
                        source={{
                          uri:
                            comp.images[0] || "https://via.placeholder.com/80",
                        }}
                        style={styles.compareImage}
                        resizeMode="cover"
                      />
                      <Text
                        style={styles.slotName}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {comp.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleEditSlot(index)}
                        style={styles.editSlotButton}
                      >
                        <Text style={styles.editSlotButtonText}>Chỉnh sửa</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.emptySlot}
                      onPress={() => handleEditSlot(index)}
                    >
                      <Text style={{ textAlign: "center" }}>Thêm sản phẩm</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
            {comparisonProducts.some((prod) => prod) && (
              <TouchableOpacity
                style={styles.compareButton}
                onPress={handleCompare}
              >
                <Text style={styles.compareButtonText}>So sánh</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleCloseCompareModal}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backButtonHeader: {
    padding: 8,
    marginLeft: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    backgroundColor: "transparent",
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#2f95dc",
    borderRadius: 25,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
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
    marginBottom: 20,
    color: "#666",
  },
  productImage: {
    width: width,
    height: width,
  },
  pagination: {
    flexDirection: "row",
    position: "absolute",
    bottom: width - 30,
    alignSelf: "center",
    backgroundColor: "transparent",
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  activeDot: {
    backgroundColor: "white",
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 100,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -25,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  headerLeft: {
    flex: 1,
    marginRight: 20,
    backgroundColor: "transparent",
  },
  headerRight: {
    alignItems: "flex-end",
    backgroundColor: "transparent",
  },
  brand: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    marginTop: 5,
  },
  starIcon: {
    marginRight: 2,
  },
  reviewCount: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  compareText: {
    fontSize: 14,
    color: "#2f95dc",
    marginLeft: 8,
    textDecorationLine: "underline",
  },
  originalPrice: {
    fontSize: 16,
    textDecorationLine: "line-through",
    color: "#999",
    marginBottom: 5,
  },
  price: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2f95dc",
  },
  discountBadge: {
    backgroundColor: "#ff4757",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  discountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  detailsContainer: {
    marginBottom: 25,
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 18,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: "transparent",
  },
  detailIcon: {
    marginRight: 10,
    width: 22,
    textAlign: "center",
  },
  detailText: {
    fontSize: 15,
    color: "#444",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  descriptionContainer: {
    marginBottom: 25,
    backgroundColor: "transparent",
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: "#555",
  },
  keyFeaturesContainer: {
    marginBottom: 25,
    backgroundColor: "transparent",
  },
  benefitsList: {
    backgroundColor: "transparent",
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  benefitIconContainer: {
    width: 30,
    backgroundColor: "transparent",
  },
  benefitText: {
    fontSize: 15,
    color: "#555",
    flex: 1,
  },
  howToUseContainer: {
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  howToUseText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#555",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 25,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 15,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  disabledButton: {
    opacity: 0.5,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#444",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "500",
    marginHorizontal: 15,
    minWidth: 20,
    textAlign: "center",
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: "#2f95dc",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 25,
  },
  cartIcon: {
    marginRight: 10,
  },
  addToCartText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "95%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  compareSlotsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  compareSlot: {
    width: 120,
    alignItems: "center",
    marginHorizontal: 5,
    height: 200,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
  },
  slotTitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  compareImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginBottom: 5,
  },
  slotName: {
    fontSize: 12,
    textAlign: "center",
  },
  emptySlot: {
    width: "100%",
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  editSlotButton: {
    backgroundColor: "#2f95dc",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginTop: 12,
  },
  editSlotButtonText: {
    color: "#fff",
    fontSize: 10,
  },
  searchContainer: {
    width: "100%",
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchButton: {
    backgroundColor: "#2f95dc",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  searchResultsContainer: {
    maxHeight: 150,
  },
  searchResultItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  compareButton: {
    backgroundColor: "#2f95dc",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginVertical: 10,
    alignSelf: "center",
  },
  compareButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  closeButton: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#2f95dc",
    borderRadius: 25,
    marginTop: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
