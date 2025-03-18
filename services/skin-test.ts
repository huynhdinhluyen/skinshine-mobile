import {SkinTestResult} from "@/types/skin-test-result/skin-test-result";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface SkinTestResultResponse {
    success: boolean;
    data: SkinTestResult;
    timestamp: string;
}

export const submitQuizResults = async (answers: { questionId: string; optionId: string }[]): Promise<boolean> => {
    try {
        const response = await fetch(`${API_URL}/skin-tests/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ answers }),
        });

        if (!response.ok) {
            throw new Error('Failed to submit quiz results');
        }

        return true;
    } catch (error) {
        console.error('Error submitting quiz results:', error);
        return false;
    }
};

export const getSkinTestResult = async (userId: string): Promise<SkinTestResult | null> => {
    try {
        const response = await fetch(`${API_URL}/skin-tests/user/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch skin test results');
        }
        const result: SkinTestResultResponse = await response.json();
        return result.data || null;
    } catch (error) {
        console.error('Error fetching skin test results:', error);
        return null;
    }
};