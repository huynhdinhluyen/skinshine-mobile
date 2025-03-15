import {Category} from "@/types/category/category";

export interface Product {
  _id: string;
  name: string;
  brand: string;
  images: string[];
  origin: string;
  capacity: number;
  price: number;
  stockQuantity: number;
  sold: number;
  description: string;
  category: Category;
  promotionId: null;
  originalPrice: number;
  discountedPrice: number;
}