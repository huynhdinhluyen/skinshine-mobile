import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { getCategories } from '@/services/category.service';
import { Category } from '@/types/category/category';

interface CategoryFilterProps {
    selectedCategory: string | null;
    onSelectCategory: (categoryId: string | null) => void;
}

const CategoryFilter = ({ selectedCategory, onSelectCategory }: CategoryFilterProps) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getCategories();
                setCategories(data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2f95dc" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <TouchableOpacity
                    style={[
                        styles.categoryItem,
                        selectedCategory === null && styles.selectedCategory
                    ]}
                    onPress={() => onSelectCategory(null)}
                >
                    <Text
                        style={[
                            styles.categoryText,
                            selectedCategory === null && styles.selectedCategoryText
                        ]}
                    >
                        All
                    </Text>
                </TouchableOpacity>

                {categories.map((category) => (
                    <TouchableOpacity
                        key={category._id}
                        style={[
                            styles.categoryItem,
                            selectedCategory === category._id && styles.selectedCategory
                        ]}
                        onPress={() => onSelectCategory(category._id)}
                    >
                        <Text
                            style={[
                                styles.categoryText,
                                selectedCategory === category._id && styles.selectedCategoryText
                            ]}
                        >
                            {category.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
    },
    loadingContainer: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 15,
    },
    categoryItem: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    selectedCategory: {
        backgroundColor: '#2f95dc',
        borderColor: '#2f95dc',
    },
    categoryText: {
        fontSize: 14,
        color: '#333',
    },
    selectedCategoryText: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default CategoryFilter;