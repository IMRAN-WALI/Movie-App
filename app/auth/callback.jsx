// app/auth/callback.jsx
import { useEffect } from "react";
import { router } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function AuthCallback() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(tabs)");
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
