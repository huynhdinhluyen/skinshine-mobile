import React from "react";
import { SafeAreaView, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

export default function OrderSuccessScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.push("/home")}>
              <FontAwesome name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <Text style={styles.headerTitle}>Đơn hàng thành công</Text>
          ),
          headerStyle: { backgroundColor: "#2f95dc" },
        }}
      />
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>
          Đơn hàng của bạn đã được đặt thành công!
        </Text>
        <Text style={styles.subtitle}>
          Cảm ơn bạn đã mua sắm tại cửa hàng của chúng tôi.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/home")}
        >
          <Text style={styles.buttonText}>Quay lại trang chủ</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#FFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2f95dc",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
