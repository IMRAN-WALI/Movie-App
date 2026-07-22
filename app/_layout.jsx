import "../src/lib/polyfills";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import "../global.css";
import { supabase } from "../src/lib/supabase";

export default function Layout() {
  const router = useRouter();
  const segments = useSegments();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Initial session check (app cold start)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });

    // Live listener — Google OAuth / any sign-in yahan fire hoga
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const inAuth = segments[0] === "auth";
    const inTabs = segments[0] === "(tabs)";

    if (session && inAuth) {
      router.replace("/(tabs)");
    } else if (!session && inTabs) {
      router.replace("/auth/login");
    }
  }, [session, ready, segments]);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1e1b4b",
        }}
      >
        <ActivityIndicator color="white" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerTitleAlign: "center", headerShown: false }}>
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
