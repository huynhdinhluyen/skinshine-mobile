import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
    Image,
    Platform, ToastAndroid
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { getTopSellingProducts, getDashboardSummary } from '@/services/dashboard.service';
import { Product } from '@/types/product/product';

const { width } = Dimensions.get('window');

export default function StaffDashboardScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [topProducts, setTopProducts] = useState<Product[]>([]);
    const [dashboardData, setDashboardData] = useState({
        revenue: {
            current: 0,
            previous: 0,
            change: 0
        },
        orders: {
            current: 0,
            previous: 0,
            change: 0,
            pending: 0
        },
        customers: {
            total: 0,
            new: 0
        },
        products: {
            total: 0,
            categories: 0,
            averageRating: 0
        },
        // For chart visualization
        salesData: [
            { date: 'Mon', value: 1200000 },
            { date: 'Tue', value: 1900000 },
            { date: 'Wed', value: 3200000 },
            { date: 'Thu', value: 2500000 },
            { date: 'Fri', value: 4500000 },
            { date: 'Sat', value: 5500000 },
            { date: 'Sun', value: 3800000 }
        ]
    });

    // Function to load all dashboard data
    const loadDashboardData = async () => {
        try {
            if (!user || !user.token) {
                ToastAndroid.show("Không thể xác thực. Vui lòng đăng nhập lại.", ToastAndroid.LONG);
                router.replace("/login");
                return;
            }

            setLoading(true);

            // Get top selling products and dashboard summary in parallel
            const [products, summary] = await Promise.all([
                getTopSellingProducts(user.token, 3),
                getDashboardSummary(user.token)
            ]);

            if (products) {
                setTopProducts(products);
            }

            if (summary) {
                setDashboardData(prevData => ({
                    ...prevData,
                    revenue: summary.revenue,
                    orders: summary.orders,
                    customers: summary.customers,
                    products: summary.products
                }));
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            ToastAndroid.show("Lỗi khi tải dữ liệu. Vui lòng thử lại sau.", ToastAndroid.SHORT);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Load data when component mounts
    useEffect(() => {
        loadDashboardData();
    }, []);

    // Function to handle refresh
    const onRefresh = async () => {
        setRefreshing(true);
        await loadDashboardData();
    };

    // Calculate max sales value for chart scaling
    const maxSales = Math.max(...dashboardData.salesData.map((item) => item.value));

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2f95dc" />
                <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
        );
    }

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Dashboard Header */}
            <LinearGradient
                colors={['#2f95dc', '#65c1ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerBanner}
            >
                <View style={styles.userInfoHeader}>
                    <View>
                        <Text style={styles.welcomeText}>Xin chào,</Text>
                        <Text style={styles.userName}>{user?.fullName || 'Staff'}</Text>
                    </View>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {(user?.fullName?.[0] || 'S').toUpperCase()}
                        </Text>
                    </View>
                </View>
                <Text style={styles.dateText}>
                    {formattedDate}
                </Text>
            </LinearGradient>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
                <TouchableOpacity
                    style={styles.statCard}
                    onPress={() => router.push('/staff/orders/index')}
                >
                    <View style={[styles.iconContainer, {backgroundColor: 'rgba(255, 159, 67, 0.2)'}]}>
                        <FontAwesome name="money" size={24} color="#ff9f43" />
                    </View>
                    <Text style={styles.statAmount}>
                        {dashboardData.revenue.current.toLocaleString()}đ
                    </Text>
                    <Text style={styles.statLabel}>Doanh thu</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.statCard}
                    onPress={() => router.push('/staff/orders?status=pending')}
                >
                    <View style={[styles.iconContainer, {backgroundColor: 'rgba(46, 213, 115, 0.2)'}]}>
                        <FontAwesome name="clock-o" size={26} color="#2ed573" />
                    </View>
                    <Text style={styles.statAmount}>{dashboardData.orders.pending}</Text>
                    <Text style={styles.statLabel}>Đơn chờ</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.statCard}
                    onPress={() => router.push('/staff/customers/index')}
                >
                    <View style={[styles.iconContainer, {backgroundColor: 'rgba(54, 153, 255, 0.2)'}]}>
                        <FontAwesome name="users" size={24} color="#3699ff" />
                    </View>
                    <Text style={styles.statAmount}>{dashboardData.customers.total}</Text>
                    <Text style={styles.statLabel}>Khách hàng</Text>
                </TouchableOpacity>
            </View>

            {/* Sales Chart */}
            <View style={styles.chartContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Doanh số gần đây</Text>
                    <TouchableOpacity>
                        <Text style={styles.sectionLink}>Xem chi tiết</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.chartContent}>
                    {dashboardData.salesData.map((item, index) => (
                        <View key={index} style={styles.chartBarContainer}>
                            <View style={styles.chartBar}>
                                <View
                                    style={[
                                        styles.chartBarFill,
                                        {
                                            height: `${(item.value / maxSales) * 100}%`,
                                            backgroundColor: item.date === 'Fri' ? '#2f95dc' : '#A1C4FD',
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.chartLabel}>{item.date}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Top Selling Products */}
            <View style={styles.productsContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Top sản phẩm bán chạy</Text>
                    <TouchableOpacity onPress={() => router.push('/staff/products/index')}>
                        <Text style={styles.sectionLink}>Tất cả</Text>
                    </TouchableOpacity>
                </View>
                {topProducts.length > 0 ? (
                    topProducts.map((product, index) => (
                        <TouchableOpacity
                            key={product._id}
                            style={styles.productItem}
                            onPress={() => router.push(`/product/${product._id}`)}
                        >
                            <View style={styles.productRankContainer}>
                                <Text style={styles.productRank}>{index + 1}</Text>
                            </View>
                            <Image
                                source={{ uri: product.images?.[0] || "https://via.placeholder.com/50" }}
                                style={styles.productImage}
                                resizeMode="cover"
                            />
                            <View style={styles.productDetails}>
                                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                                <View style={styles.productMetaRow}>
                                    <Text style={styles.productPrice}>{product.price?.toLocaleString()}đ</Text>
                                    <Text style={styles.productSold}>{product.sold || 0} đã bán</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={styles.noProductsText}>Chưa có sản phẩm bán chạy</Text>
                )}
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
                <Text style={styles.sectionTitle}>Truy cập nhanh</Text>
                <View style={styles.quickActionsGrid}>
                    <TouchableOpacity
                        style={styles.quickActionItem}
                        onPress={() => router.push('/staff/orders/index')}
                    >
                        <View style={styles.quickActionIcon}>
                            <FontAwesome name="list-alt" size={22} color="#fff" />
                        </View>
                        <Text style={styles.quickActionText}>Đơn hàng</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickActionItem}
                        onPress={() => router.push('/staff/products/index')}
                    >
                        <View style={[styles.quickActionIcon, {backgroundColor: '#4cd137'}]}>
                            <MaterialIcons name="inventory" size={22} color="#fff" />
                        </View>
                        <Text style={styles.quickActionText}>Sản phẩm</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickActionItem}
                        onPress={() => router.push('/staff/customers/index')}
                    >
                        <View style={[styles.quickActionIcon, {backgroundColor: '#ff9f43'}]}>
                            <FontAwesome name="users" size={22} color="#fff" />
                        </View>
                        <Text style={styles.quickActionText}>Khách hàng</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{height: 20}} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#555',
    },
    headerBanner: {
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    userInfoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    welcomeText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
    },
    userName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    dateText: {
        color: 'rgba(255,255,255,0.9)',
        marginTop: 15,
        fontSize: 14,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        marginTop: -10,
    },
    statCard: {
        width: width * 0.3,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 4,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statAmount: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 5,
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#777',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    sectionLink: {
        fontSize: 14,
        color: '#2f95dc',
    },
    chartContainer: {
        margin: 15,
        marginBottom: 10,
        padding: 15,
        backgroundColor: 'white',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    chartContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 150,
    },
    chartBarContainer: {
        alignItems: 'center',
    },
    chartBar: {
        width: 20,
        height: 120,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    chartBarFill: {
        width: '100%',
        backgroundColor: '#A1C4FD',
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
    },
    chartLabel: {
        marginTop: 5,
        fontSize: 12,
        color: '#777',
    },
    productsContainer: {
        margin: 15,
        marginTop: 5,
        padding: 15,
        backgroundColor: 'white',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    productItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    productRankContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#2f95dc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    productRank: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    productImage: {
        width: 40,
        height: 40,
        borderRadius: 8,
        marginRight: 12,
    },
    productDetails: {
        flex: 1,
    },
    productName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    productMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productPrice: {
        fontSize: 13,
        fontWeight: '600',
        color: '#e53935',
    },
    productSold: {
        fontSize: 12,
        color: '#888',
    },
    noProductsText: {
        textAlign: 'center',
        color: '#888',
        padding: 15,
    },
    quickActionsContainer: {
        margin: 15,
        marginTop: 5,
        padding: 15,
        backgroundColor: 'white',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    quickActionItem: {
        width: '48%',
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    quickActionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2f95dc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    quickActionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
});