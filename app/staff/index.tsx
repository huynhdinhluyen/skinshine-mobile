import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function StaffScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trang Staff</Text>
      <Text>Đây là màn hình dành cho role = "Staff" (ví dụ)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
});
