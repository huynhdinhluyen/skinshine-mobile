// app/staff/orders/_layout.tsx
import React from "react";
import { Stack } from "expo-router";

export default function OrdersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Danh sách đơn hàng",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[_id]"
        options={{
          headerTitle: "Chi tiết đơn hàng",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
