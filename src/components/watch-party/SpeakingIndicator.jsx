import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

const SpeakingIndicator = ({ active }: { active: boolean }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) {
      scale.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.4,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, scale]);

  if (!active) return null;

  return (
    <View
      style={{
        position: "absolute",
        bottom: -2,
        right: -2,
      }}
    >
      <Animated.View
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: "#4ade80",
          borderWidth: 2,
          borderColor: "#111827",
          transform: [{ scale }],
        }}
      />
    </View>
  );
};

export default SpeakingIndicator;
