import {Category} from "@/types/category/category";

export interface Product {
  _id: string;
  name: string;
  brand: string;
  images: string[];
  skinTypes: string[];
  origin: string;
  capacity: number;
  price: number;
  stockQuantity: number;
  sold: number;
  ingredients: string;
  description: string;
  category: Category;
  promotionId: null;
  feedback: any[];
  averageRating: number;
  reviewCount: number;
  originalPrice: number;
  discountedPrice: number;
}