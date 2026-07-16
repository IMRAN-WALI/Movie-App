import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text } from "react-native";

const Search = () => {
  return (
    <LinearGradient
      colors={["#3b82f6", "#4338ca"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      className="flex-1 px-6 items-center justify-center"
    >
      <Text className="text-3xl font-semibold text-white">Search</Text>
      <Text className="mt-2 text-base text-slate-100 text-center">
        Find movies, actors, and curated collections.
      </Text>
    </LinearGradient>
  );
};

export default Search;
