import "../src/lib/polyfills";
import { Stack } from "expo-router";
import "../global.css";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerShown: false,
      }}
    >
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
