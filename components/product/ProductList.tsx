import React from 'react';
import { StyleSheet, FlatList, ActivityIndicator, RefreshControl, RefreshControlProps } from 'react-native';
import { Text, View } from '@/components/Themed';
import ProductCard from './ProductCard';
import { Product } from '@/types/product/product';

interface ProductListProps {
    products: Product[];
    loading: boolean;
    onEndReached?: () => void;
    refreshControl?: React.ReactElement<RefreshControlProps>;
}

const ProductList = ({ products, loading, onEndReached, refreshControl }: ProductListProps) => {
    if (loading && products.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2f95dc" />
            </View>
        );
    }

    if (products.length === 0 && !loading) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No products found</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={products}
            renderItem={({ item }) => <ProductCard product={item} />}
            keyExtractor={(item, index) => `${item._id}_${index}`}  // Use combination of ID and index for uniqueness
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            refreshControl={refreshControl}
            ListFooterComponent={
                loading && products.length > 0 ? (
                    <View style={styles.footerLoader}>
                        <ActivityIndicator size="small" color="#2f95dc" />
                    </View>
                ) : null
            }
        />
    );
};

const styles = StyleSheet.create({
    columnWrapper: {
        justifyContent: 'space-between',
        paddingHorizontal: 15,
    },
    contentContainer: {
        paddingVertical: 10,
        paddingBottom: 30,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});

export default ProductList;