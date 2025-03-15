import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
// Giả sử API_URL được lấy từ biến môi trường (hoặc constants)
// hoặc bạn có thể sử dụng Babel plugin để import trực tiếp từ .env.
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  // Reset lại state mỗi khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      setEmail("");
      setPassword("");
    }, [])
  );

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const { token } = data.data;

        try {
          await login(token);
        } catch (error: any) {
          Alert.alert(
            "Lỗi đăng nhập",
            error.message || "Token không hợp lệ, vui lòng thử lại!"
          );
          router.replace("/(tabs)/account");
          return;
        }
        router.replace("/(tabs)/home");
      } else {
        Alert.alert(
          "Đăng nhập thất bại",
          data?.message || "Sai thông tin đăng nhập"
        );
      }
    } catch (error) {
      console.error("Error during login:", error);
      Alert.alert("Lỗi", "Không thể kết nối tới server");
    }
  };

  const handleSignup = () => {
    router.replace("/signup");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đăng nhập</Text>
      </View>
      <Text style={styles.description}>
        Chào mừng bạn đến với cửa hàng mỹ phẩm MMA
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>ĐĂNG NHẬP</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
        <Text style={styles.signupButtonText}>
          Bạn chưa có tài khoản đăng nhập? Đăng ký ngay
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#2f95dc",
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
  },
  description: {
    textAlign: "center",
    fontSize: 20,
    marginBottom: 12,
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
    padding: 15,
    marginHorizontal: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "black",
  },
  signupButton: {
    backgroundColor: "#fff",
    padding: 15,
    marginHorizontal: 12,
    borderRadius: 4,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2f95dc",
    marginTop: 10,
  },
  signupButtonText: {
    color: "#2f95dc",
    fontSize: 14,
  },
});
