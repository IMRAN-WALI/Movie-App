import React from "react";
import { Stack } from "expo-router";

const WatchPartyLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[sessionId]" />
    </Stack>
  );
};

export default WatchPartyLayout;
