import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';

export default function StaffLayout() {
    const { user } = useAuth();

    if (!user || user.role !== 'STAFF') {
        return <Redirect href="/(tabs)/home" />;
    }

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors.light.tint,
                tabBarStyle: {
                    height: 60,
                    paddingBottom: 10,
                    paddingTop: 5,
                },
                headerStyle: {
                    backgroundColor: '#2f95dc',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: '500',
                },
                headerTitleAlign: 'center',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarLabel: 'Dashboard',
                    tabBarIcon: ({ color }) => <MaterialIcons name="dashboard" size={24} color={color} />,
                    headerShown: false,
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Đơn hàng',
                    tabBarLabel: 'Đơn hàng',
                    tabBarIcon: ({ color }) => <FontAwesome name="shopping-bag" size={22} color={color} />,
                    headerShown: true,
                }}
            />
            <Tabs.Screen
                name="products/index"
                options={{
                    title: 'Sản phẩm',
                    tabBarLabel: 'Sản phẩm',
                    tabBarIcon: ({ color }) => <MaterialIcons name="inventory" size={24} color={color} />,
                    headerShown: true,
                }}
            />
            <Tabs.Screen
                name="customers/index"
                options={{
                    title: 'Khách hàng',
                    tabBarLabel: 'Khách hàng',
                    tabBarIcon: ({ color }) => <FontAwesome name="users" size={22} color={color} />,
                    headerShown: true,
                }}
            />
            <Tabs.Screen
                name="profile/index"
                options={{
                    title: 'Hồ sơ',
                    tabBarLabel: 'Hồ sơ',
                    tabBarIcon: ({ color }) => <FontAwesome name="user" size={22} color={color} />,
                    headerShown: true,
                }}
            />
        </Tabs>
    );
}