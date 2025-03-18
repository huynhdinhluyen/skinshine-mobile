import {Question} from "@/types/question/question";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface QuestionResponse {
    success: boolean;
    data: Question[];
    timestamp: string;
}

export const getQuestions = async (): Promise<Question[]> => {
    try {
        const response = await fetch(`${API_URL}/questions`);
        if (!response.ok) {
            throw new Error('Failed to fetch questions');
        }
        const result: QuestionResponse = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('Error fetching quiz questions:', error);
        return [];
    }
};