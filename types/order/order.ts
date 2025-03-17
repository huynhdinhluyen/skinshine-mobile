import {Product} from "@/types/product/product";
import {Payment} from "@/types/payment/payment";

export interface Order {
  _id: string;
  user: User;
  items: Item[];
  totalQuantity: number;
  totalPrice: number;
  discount: number;
  shippingFee: number;
  shippingAddress: ShippingAddress;
  orderStatus: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  payment: Payment;
}

interface ShippingAddress {
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  phone: string;
}

interface Item {
  productId: ProductId;
  quantity: number;
  price: number;
  subTotal: number;
  _id: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductId {
  _id: string;
  name: string;
  images: string[];
  price: number;
}

interface User {
  _id: string;
  email: string;
  fullName: string;
  phone: string;
}