import { AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/hooks/useAuth";
import { signInWithGoogle } from "../src/lib/auth";
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

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 20,
            }}
          >
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: "rgba(255,255,255,0.25)",
              }}
            />

            <Text
              style={{
                color: "rgba(255,255,255,0.7)",
                marginHorizontal: 15,
                fontWeight: "600",
                letterSpacing: 1,
              }}
            >
              OR
            </Text>

            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: "rgba(255,255,255,0.25)",
              }}
            />
          </View>

          <Pressable
            onPress={async () => {
              try {
                await signInWithGoogle();
              } catch (err) {
                console.log(err);
              }
            }}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <AntDesign
              name="google"
              size={22}
              color="#4338ca"
              style={{ marginRight: 10 }}
            />

            <Text
              style={{
                color: "#4338ca",
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Continue with Google
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
