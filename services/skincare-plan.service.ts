import {Product} from "@/types/product/product";
import {SkincarePlan, SkinType} from "@/types/skincare-plan/skincare-plan";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface SkincarePlanResponse {
    success: boolean;
    data: {
        success: boolean;
        data: SkincarePlan;
        message: string;
    };
    timestamp: string;
}

interface SkincarePlanProductsResponse {
    success: boolean;
    data: {
        success: boolean;
        data: Product[];
        totalCount: number;
        totalPages: number;
        message: string;
    };
    timestamp: string;
}

export const getSkincarePlan = async (skinType: SkinType): Promise<SkincarePlan | null> => {
    try {
        const response = await fetch(`${API_URL}/skincare-plans/${skinType}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch skincare plan for ${skinType} skin`);
        }

        const result: SkincarePlanResponse = await response.json();
        return result.data.data || null;
    } catch (error) {
        console.error(`Error fetching skincare plan for ${skinType} skin:`, error);
        return null;
    }
};

export const getRecommendProducts = async (skinType: SkinType): Promise<Product[]> => {
    try {
        const response = await fetch(`${API_URL}/skincare-plans/${skinType}/products`);
        if (!response.ok) {
            throw new Error(`Failed to fetch recommended products for ${skinType} skin`);
        }

        const result: SkincarePlanProductsResponse = await response.json();
        return result.data.data || [];
    } catch (error) {
        console.error(`Error fetching recommended products for ${skinType} skin:`, error);
        return [];
    }
};