import {Product} from "@/types/product/product";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export interface ProductResponse {
    success: boolean;
    data: {
        data: Product[];
        totalCount: number;
        totalPages: number;
    };
    timestamp: string;
}

export interface ProductDetailResponse {
    success: boolean;
    data: Product;
    timestamp: string;
}

export interface ProductQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
}

export const getProducts = async (params?: ProductQueryParams): Promise<Product[]> => {
    try {
        let url = `${API_URL}/products`;

        if (params) {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());
            if (params.search) queryParams.append('search', params.search);
            if (params.categoryId) queryParams.append('categoryId', params.categoryId);

            if (queryParams.toString()) {
                url += `?${queryParams.toString()}`;
            }
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const result: ProductResponse = await response.json();
        return result.data.data || [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
};

export const getProductById = async (id: string): Promise<Product | null> => {
    try {
        const response = await fetch(`${API_URL}/products/${id}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const result: ProductDetailResponse = await response.json();
        return result.data || null;
    } catch (error) {
        console.error(`Error fetching product with ID ${id}:`, error);
        return null;
    }
};