import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const FEATURE_LINKS = [
  {
    key: "watch-party",
    label: "Watch Party",
    subtitle: "Sync up and watch with friends",
    icon: "people-outline",
    colors: ["#4f46e5", "#3730a3"],
    onPress: () => router.push("/watch-party"),
  },
  {
    key: "taste-dna",
    label: "Taste DNA",
    subtitle: "See your personalized taste graph",
    icon: "analytics-outline",
    colors: ["#7c3aed", "#4f46e5"],
    onPress: () => router.push("/taste-dna"),
  },
  {
    key: "clips",
    label: "Clips & Memes",
    subtitle: "Browse and share 10s clips",
    icon: "film-outline",
    colors: ["#0ea5e9", "#4338ca"],
    onPress: () => router.push("/clips/feed"),
  },
  {
    key: "trending",
    label: "Trending Near You",
    subtitle: "What people nearby are watching",
    icon: "location-outline",
    colors: ["#f97316", "#c026d3"],
    onPress: () => router.push("/trending"),
  },
];

const HIGHLIGHT_CARDS = [
  {
    key: "social-night",
    title: "Social Night",
    subtitle: "Plan a cozy watch session with friends",
    icon: "sparkles",
    colors: ["#fb923c", "#f43f5e"],
  },
  {
    key: "curated-picks",
    title: "Curated Picks",
    subtitle: "Fresh recommendations tailored for you",
    icon: "film",
    colors: ["#22c55e", "#0f766e"],
  },
  {
    key: "local-favorites",
    title: "Local Favorites",
    subtitle: "Explore what’s trending around you",
    icon: "location",
    colors: ["#38bdf8", "#6366f1"],
  },
];

const Home = () => {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={["#181a3b", "#4f46e5", "#60a5fa"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            position: "absolute",
            top: -60,
            right: -50,
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: "rgba(255,255,255,0.14)",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: -40,
            left: -30,
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: "rgba(255,255,255,0.1)",
          }}
        />

        <ScrollView
          contentContainerStyle={{
            paddingTop: (insets.top || 12) + 8,
            paddingHorizontal: 20,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: "center", marginBottom: 18 }}>
            <View
              style={{
                width: 92,
                height: 92,
                borderRadius: 30,
                overflow: "hidden",
                backgroundColor: "rgba(255,255,255,0.12)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.18)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Image
                source={require("../../assets/Images/MainLogo.png")}
                style={{ width: "100%", height: "100%", resizeMode: "cover" }}
              />
            </View>
          </View>

          <View
            style={{
              marginBottom: 20,
              backgroundColor: "rgba(255,255,255,0.16)",
              borderRadius: 24,
              padding: 20,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.24)",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text style={{ color: "white", fontSize: 24, fontWeight: "800" }}>
                Movie night, elevated
              </Text>
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{ color: "white", fontWeight: "700", fontSize: 12 }}
                >
                  NEW
                </Text>
              </View>
            </View>
            <Text
              style={{
                color: "rgba(255,255,255,0.84)",
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 16,
              }}
            >
              Discover shared experiences, curated picks, and local favorites in
              one beautiful hub.
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {[
                { label: "Personalized", icon: "sparkles" },
                { label: "Social", icon: "people" },
                { label: "Local", icon: "location" },
              ].map((item) => (
                <View
                  key={item.label}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.16)",
                    borderRadius: 999,
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                    marginRight: 8,
                    marginBottom: 8,
                  }}
                >
                  <Ionicons name={item.icon} size={13} color="white" />
                  <Text
                    style={{
                      color: "white",
                      fontSize: 12,
                      fontWeight: "600",
                      marginLeft: 6,
                    }}
                  >
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>
              Explore now
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
              4 experiences
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 8, paddingBottom: 6 }}
            style={{ marginBottom: 14 }}
          >
            {HIGHLIGHT_CARDS.map((card) => (
              <LinearGradient
                key={card.key}
                colors={card.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 170,
                  borderRadius: 18,
                  padding: 14,
                  marginRight: 10,
                  minHeight: 110,
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name={card.icon} size={18} color="white" />
                </View>
                <View>
                  <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>
                    {card.title}
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.86)",
                      fontSize: 12,
                      marginTop: 4,
                      lineHeight: 16,
                    }}
                  >
                    {card.subtitle}
                  </Text>
                </View>
              </LinearGradient>
            ))}
          </ScrollView>

          <View>
            {FEATURE_LINKS.map((feature) => (
              <Pressable
                key={feature.key}
                onPress={feature.onPress}
                style={{ marginBottom: 12 }}
              >
                <LinearGradient
                  colors={feature.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 20,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 23,
                      backgroundColor: "rgba(255,255,255,0.16)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                    }}
                  >
                    <Ionicons name={feature.icon} size={22} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "700",
                        fontSize: 16,
                      }}
                    >
                      {feature.label}
                    </Text>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.85)",
                        fontSize: 13,
                        marginTop: 2,
                      }}
                    >
                      {feature.subtitle}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="rgba(255,255,255,0.8)"
                  />
                </LinearGradient>
              </Pressable>
            ))}
          </View>

          <View style={{ alignItems: "center", marginTop: 10 }}>
            <Text
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: 12,
                textAlign: "center",
              }}
            >
              Your next favorite movie moment is just a tap away.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Home;
