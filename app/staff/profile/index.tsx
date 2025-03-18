import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    ToastAndroid,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function StaffProfileScreen() {
    const router = useRouter();
    const { user, logout, setUser } = useAuth();

    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');

    // Password change fields
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const API_URL = process.env.EXPO_PUBLIC_API_URL;

    useEffect(() => {
        if (user) {
            setFullName(user.fullName || '');
            setEmail(user.email || '');
            setPhone(user.phone || '');
            setAddress(user.address || '');
            setCity(user.city || '');
        }
    }, [user]);

    const handleUpdateProfile = async () => {
        if (!user) return;

        try {
            setLoading(true);

            const response = await fetch(`${API_URL}/auth/${user.id}/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    fullName,
                    city,
                    address,
                    phone
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Update local user data
                const updatedUser = { ...user, ...data.data };
                setUser(updatedUser);

                if (Platform.OS === 'android') {
                    ToastAndroid.show('Thông tin đã được cập nhật thành công', ToastAndroid.SHORT);
                } else {
                    Alert.alert('Thành công', 'Thông tin đã được cập nhật thành công');
                }
            } else {
                Alert.alert('Lỗi', data?.message || 'Không thể cập nhật thông tin');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Lỗi', 'Không thể kết nối tới server');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!user) return;

        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới cần có ít nhất 6 ký tự');
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`${API_URL}/auth/${user.id}/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    oldPassword,
                    newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Thành công', 'Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại.');
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                await logout();
            } else {
                Alert.alert('Lỗi', data?.message || 'Không thể thay đổi mật khẩu');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            Alert.alert('Lỗi', 'Không thể kết nối tới server');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(tabs)/home');
                    }
                }
            ]
        );
    };

    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>
                    Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.
                </Text>
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => router.replace('/login')}
                >
                    <Text style={styles.loginButtonText}>Đăng nhập</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Profile Header */}
            <LinearGradient
                colors={['#2f95dc', '#5fb8ff']}
                style={styles.header}
            >
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                        {user.fullName ? user.fullName[0].toUpperCase() : 'S'}
                    </Text>
                </View>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerName}>{user.fullName}</Text>
                    <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>Nhân viên</Text>
                    </View>
                    <Text style={styles.headerEmail}>{user.email}</Text>
                </View>
            </LinearGradient>

            {/* Profile Information Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <FontAwesome name="user" size={18} color="#2f95dc" />
                    <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Họ và tên</Text>
                    <TextInput
                        style={styles.input}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Nhập họ và tên"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                        style={[styles.input, styles.disabledInput]}
                        value={email}
                        editable={false}
                        placeholder="Email"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Số điện thoại</Text>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Nhập số điện thoại"
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Địa chỉ</Text>
                    <TextInput
                        style={styles.input}
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Nhập địa chỉ"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Thành phố</Text>
                    <TextInput
                        style={styles.input}
                        value={city}
                        onChangeText={setCity}
                        placeholder="Nhập thành phố"
                    />
                </View>

                <TouchableOpacity
                    style={styles.updateButton}
                    onPress={handleUpdateProfile}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.updateButtonText}>CẬP NHẬT THÔNG TIN</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Password Change Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <FontAwesome name="lock" size={18} color="#2f95dc" />
                    <Text style={styles.sectionTitle}>Thay đổi mật khẩu</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
                    <TextInput
                        style={styles.input}
                        value={oldPassword}
                        onChangeText={setOldPassword}
                        placeholder="Nhập mật khẩu hiện tại"
                        secureTextEntry
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Mật khẩu mới</Text>
                    <TextInput
                        style={styles.input}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Nhập mật khẩu mới"
                        secureTextEntry
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
                    <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Nhập lại mật khẩu mới"
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={[styles.updateButton, styles.passwordButton]}
                    onPress={handleChangePassword}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.updateButtonText}>ĐỔI MẬT KHẨU</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
            >
                <FontAwesome name="sign-out" size={18} color="#fff" style={styles.logoutIcon} />
                <Text style={styles.logoutButtonText}>ĐĂNG XUẤT</Text>
            </TouchableOpacity>

            {/* Version info */}
            <Text style={styles.versionText}>Phiên bản 1.0.0</Text>

            {/* Bottom padding */}
            <View style={{height: 40}} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        margin: 20,
        color: '#555',
    },
    header: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    headerEmail: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    badgeContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 12,
        paddingVertical: 3,
        paddingHorizontal: 8,
        marginBottom: 5,
        alignSelf: 'flex-start',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginHorizontal: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
        color: '#444',
    },
    inputContainer: {
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 14,
        color: '#555',
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    disabledInput: {
        backgroundColor: '#e5e5e5',
        color: '#777',
    },
    updateButton: {
        backgroundColor: '#2f95dc',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    updateButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    passwordButton: {
        backgroundColor: '#4285F4',
    },
    logoutButton: {
        backgroundColor: '#e74c3c',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 15,
        marginBottom: 15,
        flexDirection: 'row',
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    logoutIcon: {
        marginRight: 8,
    },
    loginButton: {
        backgroundColor: '#2f95dc',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 20,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    versionText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
        marginTop: 10,
        marginBottom: 20,
    }
});