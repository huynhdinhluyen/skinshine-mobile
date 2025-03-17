import React, { createContext, useContext, useState, ReactNode } from "react";

export type Product = {
  _id: string;
  name: string;
  images: string[];
  price: number;
  stockQuantity: number;
  promotionId?: string | null;
  originalPrice: number;
  discountedPrice: number;
};

export type CartItem = {
  _id: string;
  product: Product;
  quantity: number;
};

export type Cart = {
  _id: string;
  user: string;
  items: CartItem[];
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

type CartContextType = {
  cart: Cart | null;
  getCartCount: () => number;
  fetchCartFromServer: (userId: string, token: string) => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const getCartCount = () => {
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const fetchCartFromServer = async (userId: string, token: string) => {
    try {
      const response = await fetch(`${API_URL}/carts/${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.log("Lỗi khi fetch cart:", response.status);
        return;
      }

      const json = await response.json();
      setCart(json.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  return (
    <CartContext.Provider value={{ cart, getCartCount, fetchCartFromServer }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart phải được sử dụng trong <CartProvider>!");
  }
  return context;
}
