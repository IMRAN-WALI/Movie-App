import React from "react";
import { Stack } from "expo-router";

const ClipsLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="feed" />
      <Stack.Screen name="create" />
    </Stack>
  );
};

export default ClipsLayout;
