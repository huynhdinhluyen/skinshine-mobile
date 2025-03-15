import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

const errorMessageMap: Record<string, string> = {
  "username should not be empty": "Tên đăng nhập không được để trống",
  "Please enter correct email format": "Vui lòng nhập đúng định dạng email",
  "email should not be empty": "Email không được để trống",
  "password must be longer than or equal to 6 characters":
    "Mật khẩu phải có ít nhất 6 ký tự",
  "password should not be empty": "Mật khẩu không được để trống",
  "fullName should not be empty": "Họ tên không được để trống",
  "Please enter correct phone number format":
    "Vui lòng nhập đúng định dạng số điện thoại",
  "phone should not be empty": "Số điện thoại không được để trống",
  "Email already exists": "Email đã tồn tại",
};

export default function SignupScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const router = useRouter();

  const handleSignup = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          fullName,
          phone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Đăng ký thành công",
          "Vui lòng đăng nhập với tài khoản mới"
        );
        router.replace("/(tabs)/account");
      } else {
        if (Array.isArray(data?.message)) {
          const translated = data.message.map((msg: string) => {
            return errorMessageMap[msg] ?? msg;
          });

          Alert.alert("Đăng ký thất bại", translated.join("\n"));
        } else {
          let errMsg = "Có lỗi xảy ra khi đăng ký";

          if (typeof data?.message === "string") {
            errMsg = errorMessageMap[data.message] ?? data.message;
          }

          Alert.alert("Đăng ký thất bại", errMsg);
        }
      }
    } catch (error) {
      console.error("Error during signup:", error);
      Alert.alert("Lỗi", "Không thể kết nối tới server");
    }
  };

  const handleLogin = () => {
    router.replace("/account");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đăng ký</Text>
      </View>
      <Text style={styles.description}>
        Chào mừng bạn đến với cửa hàng mỹ phẩm MMA
      </Text>
      <Text style={styles.headerTitle}>Đăng ký</Text>
      <TextInput
        style={styles.input}
        placeholder="Tên đăng nhập"
        value={username}
        onChangeText={setUsername}
      />
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
      <TextInput
        style={styles.input}
        placeholder="Họ và tên"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="Số điện thoại"
        value={phone}
        onChangeText={setPhone}
      />
      <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
        <Text style={styles.signupButtonText}>ĐĂNG KÝ</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>
          Bạn đã có tài khoản? Đăng nhập ngay
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
  signupButton: {
    backgroundColor: "#2f95dc",
    padding: 15,
    marginHorizontal: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  signupButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "black",
  },
  loginButton: {
    backgroundColor: "#fff",
    padding: 15,
    marginHorizontal: 12,
    borderRadius: 4,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2f95dc",
    marginTop: 10,
  },
  loginButtonText: {
    color: "#2f95dc",
    fontSize: 14,
  },
});
