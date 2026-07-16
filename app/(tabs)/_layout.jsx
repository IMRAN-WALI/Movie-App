import React from "react";
import { View, Pressable, Text, Platform } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cssInterop } from "nativewind";

// Enable className on LinearGradient
cssInterop(LinearGradient, { className: "style" });

const TABS = [
  { name: "index", label: "Home", icon: "home-outline" },
  { name: "search", label: "Search", icon: "search-outline" },
  { name: "saved", label: "Saved", icon: "bookmark-outline" },
  { name: "profile", label: "Profile", icon: "person-outline" },
];

const CustomTabBar = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute left-0 right-0 bottom-0 px-4"
      style={{ paddingBottom: insets.bottom + 10 }}
      accessibilityRole={Platform.OS === "web" ? "navigation" : undefined}
      accessibilityLabel="Bottom navigation"
    >
      <LinearGradient
        colors={["#3730a3", "#4f46e5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-row items-center justify-between h-16 px-2.5 rounded-full shadow-lg shadow-black/40 overflow-hidden"
      >
        {state.routes.map((route, index) => {
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const a11yLabel = `${tab.label} tab`;
          const a11yHint = isFocused
            ? `${tab.label} tab, currently selected`
            : `Switch to ${tab.label} tab`;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              className={
                isFocused
                  ? "flex-[2] h-full flex-row items-center justify-center px-1"
                  : "flex-1 h-full flex-row items-center justify-center"
              }
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={a11yLabel}
              accessibilityHint={a11yHint}
            >
              {isFocused ? (
                <LinearGradient
                  colors={["#3b82f6", "#60a5fa"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="flex-row items-center justify-center px-4 h-11 rounded-full self-stretch grow my-2"
                >
                  <Ionicons
                    name={tab.icon}
                    size={20}
                    color="#ffffff"
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  />
                  <Text
                    className="text-white text-[15px] font-semibold ml-2"
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                </LinearGradient>
              ) : (
                <Ionicons
                  name={tab.icon}
                  size={22}
                  color="#ffffff"
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              )}
            </Pressable>
          );
        })}
      </LinearGradient>
    </View>
  );
};

const _layout = () => {
  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="saved" options={{ title: "Saved" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
};

export default _layout;
