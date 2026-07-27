import "../src/lib/polyfills";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import "../global.css";
import { supabase } from "../src/lib/supabase";
import { isAuthRedirectSuppressed } from "../src/lib/authRedirectLock";

export default function Layout() {
  const router = useRouter();
  const segments = useSegments();

  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (isAuthRedirectSuppressed()) return;

    const inAuth = segments[0] === "auth";
    const inTabs = segments[0] === "(tabs)";

    const redirectAuthPages = [
      "login",
      "signup",
      "forgot-password",
      "verify-code",
      "reset-password",
    ];

    const currentPage = segments[1];

    if (session && inAuth && redirectAuthPages.includes(currentPage)) {
      router.replace("/(tabs)");
      return;
    }

    if (!session && inTabs) {
      router.replace("/auth/login");
      return;
    }
  }, [session, ready, segments, router]);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1e1b4b",
        }}
      >
        <ActivityIndicator color="white" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="movies/[id]" />
      <Stack.Screen name="watch-party" />
      <Stack.Screen name="taste-dna/index" />
      <Stack.Screen name="clips" />
      <Stack.Screen name="trending/index" />
    </Stack>
  );
}
