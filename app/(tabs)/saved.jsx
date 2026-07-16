import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text } from "react-native";

const Saved = () => {
  return (
    <LinearGradient
      colors={["#4f46e5", "#312e81"]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      className="flex-1 px-6 items-center justify-center"
    >
      <Text className="text-3xl font-semibold text-white">Saved</Text>
      <Text className="mt-2 text-base text-slate-100 text-center">
        Your bookmarked movies and watchlist are saved here.
      </Text>
    </LinearGradient>
  );
};

export default Saved;
