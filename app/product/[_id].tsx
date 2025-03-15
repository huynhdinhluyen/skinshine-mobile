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
} from "react-native";
import { Text, View } from "@/components/Themed";
import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { getProductById } from "@/services/product.service";
import { Product } from "@/types/product/product";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { _id } = useLocalSearchParams<{ _id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

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

  const handleAddToCart = () => {
    alert(`${quantity} ${quantity > 1 ? "items" : "item"} added to cart!`);
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
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
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
              </View>
            </View>

            <View style={styles.headerRight}>
              {product.discountedPrice < product.originalPrice ? (
                <>
                  <Text style={styles.originalPrice}>
                    đ{product.originalPrice.toFixed(2)}
                  </Text>
                  <Text style={styles.price}>
                    đ{product.discountedPrice.toFixed(2)}
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
                <Text style={styles.price}>đ{product.price.toFixed(2)}</Text>
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
                <Text style={styles.detailText}>{product.category.name}</Text>
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
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
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
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#2f95dc",
    borderRadius: 25,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  headerButtons: {
    flexDirection: "row",
    backgroundColor: "transparent",
    paddingRight: 10,
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
  productImage: {
    width,
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
    paddingBottom: 100, // Space for the footer
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
});
