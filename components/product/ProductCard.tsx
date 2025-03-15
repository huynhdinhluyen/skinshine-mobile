import React from 'react';
import { StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Product } from '@/types/product/product';
import { useRouter } from 'expo-router';

interface ProductCardProps {
    product: Product;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 45) / 2; // 2 columns with margins

const ProductCard = ({ product }: ProductCardProps) => {
    const router = useRouter();

    const handlePress = () => {
        router.push(`/product/${product._id}`);
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            <Image
                source={{ uri: product.images[0] || 'https://via.placeholder.com/150' }}
                style={styles.image}
                resizeMode="cover"
            />
            <View style={styles.infoContainer}>
                <Text style={styles.brand}>{product.brand}</Text>
                <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
                <View style={styles.detailsContainer}>
                    <Text style={styles.capacity}>{product.capacity}ml</Text>
                    {product.discountedPrice < product.originalPrice ? (
                        <View style={styles.priceContainer}>
                            <Text style={styles.originalPrice}>đ{product.originalPrice}</Text>
                            <Text style={styles.price}>đ{product.discountedPrice}</Text>
                        </View>
                    ) : (
                        <Text style={styles.price}>đ{product.price}</Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: cardWidth,
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: 150,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    infoContainer: {
        padding: 12,
        backgroundColor: 'transparent',
    },
    brand: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        height: 40,
    },
    detailsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    capacity: {
        fontSize: 12,
        color: '#666',
    },
    priceContainer: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        backgroundColor: 'transparent',
    },
    price: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2f95dc',
    },
    originalPrice: {
        fontSize: 12,
        textDecorationLine: 'line-through',
        color: '#999',
    },
});

export default ProductCard;