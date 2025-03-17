import { Order } from '@/types/order/order';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export interface OrdersResponse {
    success: boolean;
    data: {
        data: Order[];
        totalCount: number;
        totalPages: number;
        currentPage: number;
    };
    timestamp: string;
}

// Interface for the single order response
export interface OrderResponse {
    success: boolean;
    data: Order;
    timestamp: string;
}

// Interface for the order status update response
export interface OrderStatusUpdateResponse {
    success: boolean;
    data: Order;
    message?: string;
    timestamp: string;
}

export interface OrderQueryParams {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
    sortBy?: string;
}

/**
 * Get orders with pagination and filtering
 * @param token Authentication token
 * @param params Query parameters for filtering and pagination
 * @returns Paginated orders and metadata
 */
export const getOrders = async (token: string, params?: OrderQueryParams): Promise<{
    orders: Order[];
    page: number;
    limit: number;
    total: number;
} | null> => {
    try {
        const queryParams = params
            ? Object.entries(params)
                .filter(([_, value]) => value !== undefined && value !== null && value !== '')
                .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
                .join('&')
            : '';

        const response = await fetch(`${API_URL}/orders?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result: OrdersResponse = await response.json();

        if (!result.success) {
            throw new Error(result.data?.toString() || 'Failed to get orders');
        }

        // Map the response to the expected format
        return {
            orders: result.data.data || [],
            total: result.data.totalCount || 0,
            page: result.data.currentPage || 1,
            limit: params?.limit || 10
        };
    } catch (error) {
        console.error('Error fetching orders:', error);
        return null;
    }
};

/**
 * Get a single order by ID
 * @param token Authentication token
 * @param orderId Order ID
 * @returns Order details
 */
export const getOrderById = async (token: string, orderId: string): Promise<Order | null> => {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result: OrderResponse = await response.json();

        if (!result.success) {
            throw new Error(result.data?.toString() || `Failed to get order ${orderId}`);
        }

        return result.data || null;
    } catch (error) {
        console.error(`Error fetching order ${orderId}:`, error);
        return null;
    }
};

/**
 * Update order status
 * @param token Authentication token
 * @param orderId Order ID
 * @param status New status
 * @returns Updated order
 */
export const updateOrderStatus = async (token: string, orderId: string, status: string): Promise<Order | null> => {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result: OrderStatusUpdateResponse = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Failed to update order status');
        }

        return result.data;
    } catch (error) {
        console.error(`Error updating order ${orderId} status:`, error);
        return null;
    }
};