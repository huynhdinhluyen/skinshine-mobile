import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ToastAndroid,
    Platform,
    FlatList
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { FontAwesome, MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getOrderById, updateOrderStatus } from '@/services/order.service';
import { Order } from '@/types/order/order';

type FontAwesomeIconName = 'clock-o' | 'refresh' | 'truck' | 'check-circle' | 'times-circle' | 'circle' | 'circle-o' | 'money' | 'credit-card' | 'exclamation-circle' | 'inbox';

const STATUS_COLORS = {
    'PENDING': '#ff9f43',
    'CONFIRMED': '#1e90ff',
    'SHIPPING': '#8e44ad',
    'DELIVERED': '#2ecc71',
    'CANCELLED': '#e74c3c'
};

const STATUS_NAMES = {
    'PENDING': 'Chờ xử lý',
    'CONFIRMED': 'Đang xử lý',
    'SHIPPING': 'Đang giao',
    'DELIVERED': 'Đã giao',
    'CANCELLED': 'Đã hủy'
};

const STATUS_ICONS: Record<string, FontAwesomeIconName> = {
    'PENDING': 'clock-o',
    'CONFIRMED': 'refresh',
    'SHIPPING': 'truck',
    'DELIVERED': 'check-circle',
    'CANCELLED': 'times-circle'
};

const NEXT_STATUS = {
    'PENDING': 'CONFIRMED',
    'CONFIRMED': 'SHIPPING',
    'SHIPPING': 'DELIVERED'
};

export default function OrderDetailsScreen() {
    const { _id } = useLocalSearchParams<{ _id: string }>();
    const { user } = useAuth();
    const router = useRouter();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        if (_id) {
            fetchOrderDetails();
        }
    }, [_id]);

    const fetchOrderDetails = async () => {
        if (!user?.token) {
            ToastAndroid.show('Bạn cần đăng nhập lại', ToastAndroid.SHORT);
            router.replace('/login');
            return;
        }

        try {
            setLoading(true);
            const orderData = await getOrderById(user.token, _id as string);
            if (orderData) {
                setOrder(orderData);
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
            ToastAndroid.show('Không thể tải thông tin đơn hàng', ToastAndroid.SHORT);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (!user?.token || !order) {
            ToastAndroid.show('Bạn cần đăng nhập lại', ToastAndroid.SHORT);
            return;
        }

        Alert.alert(
            'Cập nhật trạng thái',
            `Bạn có chắc muốn chuyển trạng thái đơn hàng thành "${STATUS_NAMES[newStatus as keyof typeof STATUS_NAMES]}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xác nhận',
                    style: 'default',
                    onPress: async () => {
                        try {
                            setUpdatingStatus(true);
                            const success = await updateOrderStatus(user.token as string, _id as string, newStatus);
                            if (success) {
                                ToastAndroid.show('Cập nhật trạng thái thành công', ToastAndroid.SHORT);
                                // Refresh order details
                                fetchOrderDetails();
                            } else {
                                ToastAndroid.show('Không thể cập nhật trạng thái', ToastAndroid.SHORT);
                            }
                        } catch (error) {
                            console.error('Error updating order status:', error);
                            ToastAndroid.show('Đã xảy ra lỗi khi cập nhật trạng thái', ToastAndroid.SHORT);
                        } finally {
                            setUpdatingStatus(false);
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2f95dc" />
                <Text style={styles.loadingText}>Đang tải thông tin đơn hàng...</Text>
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.errorContainer}>
                <FontAwesome name="exclamation-circle" size={60} color="#e74c3c" />
                <Text style={styles.errorText}>Không thể tìm thấy thông tin đơn hàng</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Determine if we can offer next status action
    const canUpdateStatus = !['DELIVERED', 'CANCELLED'].includes(order.orderStatus);
    const nextStatus = NEXT_STATUS[order.orderStatus as keyof typeof NEXT_STATUS];

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen
                options={{
                    title: `Đơn hàng #${order._id.slice(-8).toUpperCase()}`,
                    headerTitleStyle: {
                        fontSize: 16,
                    },
                    presentation: 'modal',
                    headerShown: false,
                }}
            />

            {/* Order Status Banner */}
            <LinearGradient
                colors={[
                    STATUS_COLORS[order.orderStatus as keyof typeof STATUS_COLORS] || '#999',
                    Platform.OS === 'ios'
                        ? STATUS_COLORS[order.orderStatus as keyof typeof STATUS_COLORS] + 'CC'
                        : STATUS_COLORS[order.orderStatus as keyof typeof STATUS_COLORS] + '99'
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.statusBanner}
            >
                <View style={styles.statusContainer}>
                    <FontAwesome
                        name={STATUS_ICONS[order.orderStatus as keyof typeof STATUS_ICONS] || 'circle'}
                        size={28}
                        color="#fff"
                        style={styles.statusIcon}
                    />
                    <View>
                        <Text style={styles.statusLabel}>Trạng thái đơn hàng</Text>
                        <Text style={styles.statusText}>
                            {STATUS_NAMES[order.orderStatus as keyof typeof STATUS_NAMES] || order.orderStatus}
                        </Text>
                    </View>
                </View>

                <View style={styles.orderDateContainer}>
                    <Text style={styles.orderDateLabel}>Ngày đặt hàng:</Text>
                    <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                </View>
            </LinearGradient>

            {/* Staff Actions */}
            {canUpdateStatus && (
                <View style={styles.actionContainer}>
                    <Text style={styles.actionTitle}>Thao tác</Text>

                    <TouchableOpacity
                        style={styles.actionButton}
                        disabled={updatingStatus}
                        onPress={() => handleUpdateStatus(nextStatus)}
                    >
                        <MaterialIcons name="update" size={22} color="#fff" />
                        <Text style={styles.actionButtonText}>
                            {updatingStatus ? 'Đang xử lý...' : `Chuyển sang ${STATUS_NAMES[nextStatus as keyof typeof STATUS_NAMES]}`}
                        </Text>
                    </TouchableOpacity>

                    {order.orderStatus === 'PENDING' && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            disabled={updatingStatus}
                            onPress={() => handleUpdateStatus('CANCELLED')}
                        >
                            <MaterialIcons name="cancel" size={22} color="#fff" />
                            <Text style={styles.actionButtonText}>
                                {updatingStatus ? 'Đang xử lý...' : 'Hủy đơn hàng'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Customer Information */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <MaterialIcons name="person" size={20} color="#2f95dc" />
                    <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tên khách hàng:</Text>
                    <Text style={styles.infoValue}>{order.user.fullName}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoValue}>{order.user.email}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Số điện thoại:</Text>
                    <Text style={styles.infoValue}>{order.user.phone}</Text>
                </View>
            </View>

            {/* Shipping Address */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <MaterialIcons name="local-shipping" size={20} color="#2f95dc" />
                    <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Địa chỉ:</Text>
                    <Text style={styles.infoValue}>{order.shippingAddress?.addressLine1 || ''}</Text>
                </View>

                {order.shippingAddress?.addressLine2 && (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Địa chỉ bổ sung:</Text>
                        <Text style={styles.infoValue}>{order.shippingAddress.addressLine2}</Text>
                    </View>
                )}

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Thành phố:</Text>
                    <Text style={styles.infoValue}>{order.shippingAddress?.city || ''}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tỉnh:</Text>
                    <Text style={styles.infoValue}>{order.shippingAddress?.province || ''}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>SĐT giao hàng:</Text>
                    <Text style={styles.infoValue}>{order.shippingAddress?.phone || ''}</Text>
                </View>
            </View>

            {/* Order Items */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <MaterialIcons name="shopping-bag" size={20} color="#2f95dc" />
                    <Text style={styles.sectionTitle}>Sản phẩm ({order.items.length})</Text>
                </View>

                {order.items.map((item, index) => (
                    <View key={item._id} style={styles.orderItemCard}>
                        <Image
                            source={{ uri: item.productId.images[0] }}
                            style={styles.productImage}
                            resizeMode="cover"
                        />
                        <View style={styles.productInfo}>
                            <Text style={styles.productName} numberOfLines={2}>{item.productId.name}</Text>

                            <View style={styles.productMeta}>
                                <Text style={styles.productPrice}>{item.price.toLocaleString()}đ</Text>
                                <Text style={styles.productQuantity}>x{item.quantity}</Text>
                            </View>

                            <Text style={styles.productSubtotal}>
                                Thành tiền: <Text style={styles.subtotalValue}>{item.subTotal.toLocaleString()}đ</Text>
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Payment Information */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <MaterialIcons name="payment" size={20} color="#2f95dc" />
                    <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
                </View>

                <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Tổng tiền hàng:</Text>
                    <Text style={styles.paymentValue}>
                        {(order.totalPrice - order.shippingFee + order.discount).toLocaleString()}đ
                    </Text>
                </View>

                <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Phí vận chuyển:</Text>
                    <Text style={styles.paymentValue}>{order.shippingFee.toLocaleString()}đ</Text>
                </View>

                <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Giảm giá:</Text>
                    <Text style={styles.discountValue}>-{order.discount.toLocaleString()}đ</Text>
                </View>

                <View style={[styles.paymentRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
                    <Text style={styles.totalValue}>{order.totalPrice.toLocaleString()}đ</Text>
                </View>

                <View style={styles.paymentMethodContainer}>
                    <Text style={styles.paymentMethodLabel}>Phương thức thanh toán:</Text>
                    <View style={styles.paymentMethodValue}>
                        <FontAwesome
                            name={order.payment.paymentMethod === 'COD' ? 'money' : 'credit-card'}
                            size={18}
                            color="#2f95dc"
                            style={{marginRight: 8}}
                        />
                        <Text style={styles.paymentMethodText}>
                            {order.payment.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : order.payment.paymentMethod}
                        </Text>
                    </View>
                </View>

                <View style={styles.paymentStatusContainer}>
                    <Text style={styles.paymentStatusLabel}>Trạng thái thanh toán:</Text>
                    <View style={[
                        styles.paymentStatusBadge,
                        { backgroundColor: order.payment.paymentStatus === 'PAID' ? '#2ecc71' : '#ff9f43' }
                    ]}>
                        <Text style={styles.paymentStatusText}>
                            {order.payment.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Order Timeline */}
            <View style={[styles.sectionContainer, styles.timelineContainer]}>
                <View style={styles.sectionHeader}>
                    <MaterialIcons name="timeline" size={20} color="#2f95dc" />
                    <Text style={styles.sectionTitle}>Quá trình xử lý</Text>
                </View>

                <View style={styles.timeline}>
                    <View style={[styles.timelineItem, styles.timelineItemActive]}>
                        <View style={styles.timelineBullet}>
                            <FontAwesome name="circle" size={16} color="#2f95dc" />
                        </View>
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineTitle}>Đơn hàng đã được đặt</Text>
                            <Text style={styles.timelineDate}>{formatDate(order.createdAt)}</Text>
                        </View>
                    </View>

                    <View style={[
                        styles.timelineItem,
                        order.orderStatus !== 'PENDING' ? styles.timelineItemActive : {}
                    ]}>
                        <View style={styles.timelineBullet}>
                            <FontAwesome
                                name={order.orderStatus !== 'PENDING' ? "circle" : "circle-o"}
                                size={16}
                                color={order.orderStatus !== 'PENDING' ? "#2f95dc" : "#aaa"}
                            />
                        </View>
                        <View style={styles.timelineContent}>
                            <Text style={[
                                styles.timelineTitle,
                                order.orderStatus === 'PENDING' ? styles.timelineTitleInactive : {}
                            ]}>Đơn hàng được xác nhận</Text>
                            <Text style={styles.timelineDate}>
                                {order.orderStatus !== 'PENDING' ? formatDate(order.updatedAt) : "Đang chờ xử lý"}
                            </Text>
                        </View>
                    </View>

                    <View style={[
                        styles.timelineItem,
                        ['SHIPPING', 'DELIVERED'].includes(order.orderStatus) ? styles.timelineItemActive : {}
                    ]}>
                        <View style={styles.timelineBullet}>
                            <FontAwesome
                                name={['SHIPPING', 'DELIVERED'].includes(order.orderStatus) ? "circle" : "circle-o"}
                                size={16}
                                color={['SHIPPING', 'DELIVERED'].includes(order.orderStatus) ? "#2f95dc" : "#aaa"}
                            />
                        </View>
                        <View style={styles.timelineContent}>
                            <Text style={[
                                styles.timelineTitle,
                                !['SHIPPING', 'DELIVERED'].includes(order.orderStatus) ? styles.timelineTitleInactive : {}
                            ]}>Đơn hàng đang được giao</Text>
                            <Text style={styles.timelineDate}>
                                {['SHIPPING', 'DELIVERED'].includes(order.orderStatus) ? formatDate(order.updatedAt) : "Đang chờ"}
                            </Text>
                        </View>
                    </View>

                    <View style={[
                        styles.timelineItem,
                        order.orderStatus === 'DELIVERED' ? styles.timelineItemActive : {}
                    ]}>
                        <View style={styles.timelineBullet}>
                            <FontAwesome
                                name={order.orderStatus === 'DELIVERED' ? "circle" : "circle-o"}
                                size={16}
                                color={order.orderStatus === 'DELIVERED' ? "#2f95dc" : "#aaa"}
                            />
                        </View>
                        <View style={styles.timelineContent}>
                            <Text style={[
                                styles.timelineTitle,
                                order.orderStatus !== 'DELIVERED' ? styles.timelineTitleInactive : {}
                            ]}>Giao hàng thành công</Text>
                            <Text style={styles.timelineDate}>
                                {order.orderStatus === 'DELIVERED' ? formatDate(order.updatedAt) : "Đang chờ"}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Print Button */}
            <TouchableOpacity style={styles.printButton}>
                <MaterialCommunityIcons name="printer" size={20} color="#fff" />
                <Text style={styles.printButtonText}>In hóa đơn</Text>
            </TouchableOpacity>

            {/* Bottom padding */}
            <View style={{ height: 30 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    backButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#2f95dc',
        borderRadius: 5,
    },
    backButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    statusBanner: {
        paddingVertical: 20,
        paddingHorizontal: 15,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIcon: {
        marginRight: 10,
    },
    statusLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
    },
    statusText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    orderDateContainer: {
        marginTop: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderDateLabel: {
        color: 'rgba(255,255,255,0.8)',
        marginRight: 5,
        fontSize: 13,
    },
    orderDate: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
    },
    actionContainer: {
        backgroundColor: '#fff',
        margin: 12,
        borderRadius: 10,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    actionButton: {
        backgroundColor: '#2f95dc',
        borderRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    cancelButton: {
        backgroundColor: '#e74c3c',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
    },
    sectionContainer: {
        backgroundColor: '#fff',
        margin: 12,
        marginTop: 0,
        borderRadius: 10,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        width: 120,
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    orderItemCard: {
        flexDirection: 'row',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 6,
    },
    productInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    productName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 5,
    },
    productMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    productPrice: {
        fontSize: 14,
        color: '#666',
    },
    productQuantity: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    productSubtotal: {
        fontSize: 14,
        color: '#666',
    },
    subtotalValue: {
        color: '#e53935',
        fontWeight: '600',
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    paymentLabel: {
        fontSize: 14,
        color: '#666',
    },
    paymentValue: {
        fontSize: 14,
        color: '#333',
    },
    discountValue: {
        fontSize: 14,
        color: '#2ecc71',
    },
    totalRow: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#e53935',
    },
    paymentMethodContainer: {
        marginTop: 15,
    },
    paymentMethodLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    paymentMethodValue: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 6,
    },
    paymentMethodText: {
        fontSize: 14,
        color: '#333',
    },
    paymentStatusContainer: {
        marginTop: 12,
    },
    paymentStatusLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    paymentStatusBadge: {
        alignSelf: 'flex-start',
        padding: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
    },
    paymentStatusText: {
        color: '#fff',
        fontWeight: '500',
        fontSize: 12,
    },
    timelineContainer: {
        marginBottom: 0,
    },
    timeline: {
        paddingLeft: 10,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 25,
        position: 'relative',
    },
    timelineItemActive: {
        opacity: 1,
    },
    timelineBullet: {
        width: 30,
        alignItems: 'center',
        zIndex: 2,
    },
    timelineContent: {
        flex: 1,
        paddingLeft: 5,
        paddingBottom: 10,
    },
    timelineTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 3,
    },
    timelineTitleInactive: {
        color: '#aaa',
    },
    timelineDate: {
        fontSize: 12,
        color: '#888',
    },
    printButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#555',
        marginHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 6,
        marginTop: 10,
    },
    printButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 8,
    },
});