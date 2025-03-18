import React from "react";
import { View, Text } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

type Props = {
  iconName: string;
  iconSize: number;
  iconColor: string;
  badgeCount: number;
};

export function CartIconWithBadge({
  iconName,
  iconSize,
  iconColor,
  badgeCount,
}: Props) {
  return (
    <View style={{ width: iconSize, height: iconSize }}>
      <FontAwesome name={iconName as any} size={iconSize} color={iconColor} />
      {badgeCount > 0 && (
        <View
          style={{
            position: "absolute",
            right: -6,
            top: -3,
            backgroundColor: "red",
            borderRadius: 6,
            width: 12,
            height: 12,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 8, fontWeight: "bold" }}>
            {badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
}
