import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ToastAndroid,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { login, user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      setEmail("");
      setPassword("");
    }, [])
  );

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/home");
    }
  };

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
          router.replace("/login");
          return;
        }

        ToastAndroid.showWithGravity(
          "Đăng nhập thành công!",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER
        );
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
    router.push("/signup");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
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
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 12,
  },
  backButton: {
    position: "absolute",
    left: 10,
    top: 13,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
  },
  description: {
    textAlign: "center",
    fontSize: 20,
    marginBottom: 12,
    textTransform: "uppercase",
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
