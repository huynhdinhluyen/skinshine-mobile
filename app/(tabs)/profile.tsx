import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, setUser } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  // 2 ô password để đổi mật khẩu
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setCity(user.city || "");
    }
  }, [user]);

  const handleGoLogin = () => {
    router.push("/login");
  };
  const handleGoSignup = () => {
    router.push("/signup");
  };

  const handleLogout = async () => {
    await logout();
  };

  // Cập nhật hồ sơ
  const handleUpdateProfile = async () => {
    try {
      if (!user) {
        Alert.alert("Lỗi", "Bạn chưa đăng nhập");
        return;
      }
      const userId = user.id;
      const token = user.token;

      const response = await fetch(`${API_URL}/auth/${userId}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          city,
          address,
          phone,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const updatedUser = { ...user, ...data.data };
        setUser(updatedUser);
        Alert.alert("Thông báo", "Cập nhật thành công.");
      } else {
        Alert.alert("Lỗi", data?.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Lỗi", "Không thể kết nối tới server");
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async () => {
    try {
      if (!user) {
        Alert.alert("Lỗi", "Bạn chưa đăng nhập");
        return;
      }
      const userId = user.id;
      const token = user.token;

      const response = await fetch(
        `${API_URL}/auth/${userId}/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            oldPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Thông báo", "Đổi mật khẩu thành công. Mời bạn đăng nhập lại");
        setOldPassword("");
        setNewPassword("");
        await logout()
      } else {
        Alert.alert("Lỗi", data?.message || "Đổi mật khẩu thất bại");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      Alert.alert("Lỗi", "Không thể kết nối tới server");
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Bạn chưa đăng nhập</Text>
        <Text style={styles.subtitle}>
          Để xem và chỉnh sửa hồ sơ, vui lòng đăng nhập hoặc đăng ký.
        </Text>
        <TouchableOpacity style={styles.loginButton} onPress={handleGoLogin}>
          <Text style={styles.loginButtonText}>Đăng nhập</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signupButton} onPress={handleGoSignup}>
          <Text style={styles.signupButtonText}>Đăng ký</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ của bạn</Text>
      </View>

      {/* FORM CẬP NHẬT HỒ SƠ */}
      <TextInput
        style={styles.input}
        placeholder="Họ và tên"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={[styles.input, { backgroundColor: "#ddd" }]}
        placeholder="Địa chỉ email"
        value={email}
        editable={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Số điện thoại"
        value={phone}
        onChangeText={setPhone}
      />
      <TextInput
        style={styles.input}
        placeholder="Địa chỉ"
        value={address}
        onChangeText={setAddress}
      />
      <TextInput
        style={styles.input}
        placeholder="Thành phố"
        value={city}
        onChangeText={setCity}
      />
      <TouchableOpacity
        style={styles.updateButton}
        onPress={handleUpdateProfile}
      >
        <Text style={styles.updateButtonText}>CẬP NHẬT</Text>
      </TouchableOpacity>

      {/* FORM ĐỔI MẬT KHẨU */}
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu cũ"
        secureTextEntry
        value={oldPassword}
        onChangeText={setOldPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu mới"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TouchableOpacity
        style={styles.updateButton}
        onPress={handleChangePassword}
      >
        <Text style={styles.updateButtonText}>ĐỔI MẬT KHẨU</Text>
      </TouchableOpacity>

      {/* Nút đăng xuất */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

// STYLE
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#2f95dc",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
  },
  title: {
    marginTop: 20,
    fontSize: 20,
    marginBottom: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginHorizontal: 12,
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  loginButton: {
    backgroundColor: "#2f95dc",
    padding: 12,
    borderRadius: 4,
    marginBottom: 10,
    marginHorizontal: 12,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  signupButton: {
    backgroundColor: "#fff",
    borderColor: "#2f95dc",
    borderWidth: 1,
    padding: 12,
    borderRadius: 4,
    marginHorizontal: 12,
    alignItems: "center",
  },
  signupButtonText: {
    color: "#2f95dc",
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: "#2f95dc",
    padding: 12,
    borderRadius: 4,
    marginBottom: 10,
    alignItems: "center",
    marginHorizontal: 12,
  },
  updateButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#fff",
    borderColor: "#2f95dc",
    borderWidth: 1,
    padding: 12,
    borderRadius: 4,
    marginHorizontal: 12,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#2f95dc",
    fontSize: 16,
  },
});
