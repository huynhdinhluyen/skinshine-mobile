import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
  View as RNView,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Text, View } from "@/components/Themed";
import { getProducts, ProductQueryParams } from "@/services/product.service";
import { Product } from "@/types/product/product";
import ProductList from "@/components/product/ProductList";
import CategoryFilter from "@/components/category/CategoryFilter";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  // Fetch products when component mounts or category changes
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  // Refresh products when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [selectedCategory])
  );

  const fetchProducts = async (reset = true) => {
    if (reset) {
      setLoading(true);
      setPage(1);
    }

    try {
      const params: ProductQueryParams = {
        page: reset ? 1 : page,
        limit: 10,
        search: searchQuery || undefined,
        categoryId: selectedCategory || undefined,
      };

      const data = await getProducts(params);

      if (data.length < 10) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (reset) {
        setProducts(data);
      } else {
        setProducts((prev) => [...prev, ...data]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((prevPage) => prevPage + 1);
      fetchProducts(false);
    }
  };

  const handleSearch = () => {
    fetchProducts();
  };

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNView style={styles.heroContainer}>
        <Image
          source={{
            uri: "https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
          }}
          style={styles.heroImage}
        />
        <RNView style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>Natural Beauty</Text>
          <Text style={styles.heroSubtitle}>
            Discover products for your skin type
          </Text>
        </RNView>
      </RNView>

      <View style={styles.header}>
        <Text style={styles.title}>Discover {user?.fullName}</Text>
        <Text style={styles.subtitle}>Find the perfect skincare products</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <FontAwesome name="search" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
      />

      <ProductList
        products={products}
        loading={loading}
        onEndReached={handleLoadMore}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  heroContainer: {
    height: 180,
    width: "100%",
    position: "relative",
  },
  heroImage: {
    height: "100%",
    width: "100%",
    resizeMode: "cover",
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#fff",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchButton: {
    width: 44,
    height: 44,
    backgroundColor: "#2f95dc",
    borderRadius: 22,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
