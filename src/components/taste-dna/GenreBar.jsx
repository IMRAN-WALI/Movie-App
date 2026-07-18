import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

const COLORS = [
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
];

const GenreBar = ({ label, percentage, index }) => {
  const width = useRef(new Animated.Value(0)).current;
  const color = COLORS[index % COLORS.length];

  useEffect(() => {
    Animated.timing(width, {
      toValue: percentage * 100,
      duration: 900,
      delay: index * 120,
      useNativeDriver: false,
    }).start();
  }, [percentage, index, width]);

  return (
    <View style={{ marginBottom: 14 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>{label}</Text>
        <Text style={{ color: "#cbd5e1" }}>
          {Math.round(percentage * 100)}%
        </Text>
      </View>
      <View
        style={{
          height: 10,
          backgroundColor: "#1e293b",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            height: "100%",
            borderRadius: 6,
            backgroundColor: color,
            width: width.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
            }),
          }}
        />
      </View>
    </View>
  );
};

export default GenreBar;
