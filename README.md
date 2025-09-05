# SkinShine Mobile App

A mobile e-commerce application for skincare products built with Expo, React Native, and TypeScript. Supports different user roles: Customer, Staff, and Manager.

## Features
- User Authentication: Sign up, Login, Logout (email & password)
- Product Browsing: List view, search, filter, and compare
- Product Details: Reviews & feedback
- Shopping Cart: Add/remove items, adjust quantity, select items for checkout
- Checkout: Cash on Delivery (COD), save shipping address, order history
- User Profile: View/edit personal info, change password
- Staff Dashboard: Order management (view details, update status), statistics, profile
- Admin Panel: Product and category management (CRUD)

## Getting Started

### Prerequisites
- Node.js ≥ 14.x
- npm
- Expo CLI  
  ```sh
  npm install -g expo-cli
  ```

### Installation
1. Clone the repository:  
   ```sh
   git clone <repository-url>
   cd skinshine-mobile
   ```
2. Install dependencies:  
   ```sh
   npm install
   ```
3. Create a `.env` file in the project root:  
   ```env
   EXPO_PUBLIC_API_URL=https://your.api.endpoint
   ```
4. Start the development server:  
   ```sh
   expo start
   ```

## Project Structure
```
.
├── app/                # Expo Router pages & layouts
│   ├── (tabs)/         # Tab navigation: Home, Cart, Profile, Skin Quiz
│   ├── admin/          # Admin screens: products & categories
│   ├── staff/          # Staff screens: dashboard, orders, profile
│   ├── payment/        # Payment flow & invoice
│   └── product/        # Product details & comparison
├── components/         # Reusable UI components
├── context/            # AuthContext, CartContext
├── services/           # API calls (products, orders, auth, etc.)
├── assets/             # Images, fonts, static data
├── types/              # TypeScript interfaces
└── README.md           # Project documentation
```

## Environment Variables
- `EXPO_PUBLIC_API_URL` – Base URL for API endpoints (Auth, Products, Orders, etc.)

## Technologies
- Expo, React Native, TypeScript
- Expo Router (app directory)
- React Navigation & Gesture Handler
- Context API for state management
- Axios/fetch for API requests
- Vector Icons (`@expo/vector-icons`)

---

Version 1.0.0
