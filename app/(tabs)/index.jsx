import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const Home = () => {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={["#4f46e5", "#6366f1", "#60a5fa"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      className="flex-1 px-6 items-center justify-center "
    >
      <SafeAreaView
        style={{
          position: "absolute",
          top: (insets.top || 12) + 6,
          left: 0,
          right: 0,
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 30,
            overflow: "hidden",
            backgroundColor: "rgba(255,255,255,0.10)",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Image
            source={require("../../assets/Images/MainLogo.png")}
            style={{ width: "100%", height: "100%", resizeMode: "cover" }}
          />
        </View>
      </SafeAreaView>

      <Text className="text-3xl font-semibold text-white">Home</Text>
      <Text className="mt-2 text-base text-slate-100 text-center">
        Welcome to the Movie App.
      </Text>
    </LinearGradient>
  );
};

export default Home;
