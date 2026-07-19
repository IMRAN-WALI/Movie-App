import React, { useEffect } from "react";
import { View, Text, Image, Pressable, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "../src/hooks/useAuth";
import { isAuthRedirectSuppressed } from "../src/lib/authRedirectLock";

export default function Landing() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session && !isAuthRedirectSuppressed()) {
      router.replace("/(tabs)");
    }
  }, [loading, session]);

  if (loading) {
    return (
      <LinearGradient
        colors={["#4f46e5", "#312e81"]}
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <ActivityIndicator color="white" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#4f46e5", "#6366f1", "#312e81"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 28 }}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <View
            style={{
              width: 110,
              height: 110,
              borderRadius: 32,
              backgroundColor: "rgba(255,255,255,0.12)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Image
              source={require("../assets/Images/MainLogo.png")}
              style={{ width: "70%", height: "70%", resizeMode: "contain" }}
            />
          </View>
          <Text
            style={{
              color: "white",
              fontSize: 34,
              fontWeight: "800",
              textAlign: "center",
            }}
          >
            Movie App
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 15,
              textAlign: "center",
              marginTop: 10,
              lineHeight: 22,
            }}
          >
            Watch together, discover your taste, and share the moments that
            matter.
          </Text>
        </View>

        <View style={{ paddingBottom: 30, gap: 14 }}>
          <Pressable
            onPress={() => router.push("/auth/login")}
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#4338ca", fontWeight: "700", fontSize: 16 }}>
              Log In
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/auth/signup")}
            style={{
              borderColor: "white",
              borderWidth: 1.5,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
              Create Account
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
