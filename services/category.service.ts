import { Category } from "@/types/category/category";

interface CategoryResponse {
  success: boolean;
  data: Category[];
  timestamp: string;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const getCategories = async (): Promise<Category[]> => {
    try {
        const response = await fetch(`${API_URL}/categories`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const result: CategoryResponse = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
};