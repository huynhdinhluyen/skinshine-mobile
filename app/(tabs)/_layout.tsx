import React, { useEffect } from "react";
import { Pressable } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, Tabs } from "expo-router";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { CartIconWithBadge } from "@/components/CartIconWithBadge";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

function TabBarIcon({
  size,
  ...rest
}: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
  size: number;
}) {
  return <FontAwesome style={{ marginBottom: -3 }} size={size} {...rest} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const { fetchCartFromServer, getCartCount } = useCart();

  useEffect(() => {
    if (user && user.id && user.token) {
      fetchCartFromServer(user.id, user.token);
    }
  }, [user]);

  const badgeCount = getCartCount();

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: "#888888",
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        headerShown: useClientOnlyValue(false, true),
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="home" color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="skin-quiz"
        options={{
          title: "Quiz",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="question-circle" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          headerShown: false,
          title: "Giỏ hàng",
          tabBarIcon: ({ color, size }) => (
            <CartIconWithBadge
              iconName="shopping-cart"
              iconSize={size}
              iconColor={color}
              badgeCount={badgeCount}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          tabBarLabel: "Hồ sơ",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="user" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
