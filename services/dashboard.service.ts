import { Product } from '@/types/product/product';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Interface for the top selling products response
export interface TopSellingProductsResponse {
    success: boolean;
    data: Product[];
    timestamp: string;
}

// Interface for the dashboard summary response
export interface DashboardSummaryResponse {
    success: boolean;
    data: {
        revenue: {
            current: number;
            previous: number;
            change: number;
        };
        orders: {
            current: number;
            previous: number;
            change: number;
            pending: number;
        };
        customers: {
            total: number;
            new: number;
        };
        products: {
            total: number;
            categories: number;
            averageRating: number;
        };
    };
    timestamp: string;
}

/**
 * Fetches the top selling products
 * @param token Authentication token
 * @param limit Optional limit for number of products to return
 * @returns An array of top selling products
 */
export const getTopSellingProducts = async (token: string, limit?: number): Promise<Product[]> => {
    try {
        let url = `${API_URL}/dashboard/top-selling-products`;

        if (limit) {
            url += `?limit=${limit}`;
        }

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result: TopSellingProductsResponse = await response.json();

        if (!result.success) {
            throw new Error('Failed to get top selling products');
        }

        return result.data || [];
    } catch (error) {
        console.error('Error fetching top selling products:', error);
        return [];
    }
};

/**
 * Fetches dashboard summary statistics
 * @param token Authentication token
 * @returns Dashboard summary statistics
 */
export const getDashboardSummary = async (token: string): Promise<DashboardSummaryResponse['data'] | null> => {
    try {
        const response = await fetch(`${API_URL}/dashboard/summary`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result: DashboardSummaryResponse = await response.json();

        if (!result.success) {
            throw new Error('Failed to get dashboard statistics');
        }

        return result.data || null;
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        return null;
    }
};