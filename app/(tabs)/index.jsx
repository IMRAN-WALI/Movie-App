import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  ImageBackground,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useLanguage } from "../../src/i18n/LanguageContext";

const Home = () => {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const FEATURE_LINKS = useMemo(
    () => [
      {
        key: "watch-party",
        label: t("home_watch_party"),
        subtitle: t("home_watch_party_sub"),
        icon: "people-outline",
        colors: ["#4f46e5", "#3730a3"],
        onPress: () => router.push("/watch-party"),
      },
      {
        key: "taste-dna",
        label: t("home_taste_dna"),
        subtitle: t("home_taste_dna_sub"),
        icon: "analytics-outline",
        colors: ["#7c3aed", "#4f46e5"],
        onPress: () => router.push("/taste-dna"),
      },
      {
        key: "clips",
        label: t("home_clips"),
        subtitle: t("home_clips_sub"),
        icon: "film-outline",
        colors: ["#0ea5e9", "#4338ca"],
        onPress: () => router.push("/clips/feed"),
      },
      {
        key: "trending",
        label: t("home_trending"),
        subtitle: t("home_trending_sub"),
        icon: "location-outline",
        colors: ["#f97316", "#c026d3"],
        onPress: () => router.push("/trending"),
      },
    ],
    [t],
  );

  const HIGHLIGHT_CARDS = useMemo(
    () => [
      {
        key: "social-night",
        title: t("home_social_night"),
        subtitle: t("home_social_night_sub"),
        icon: "people",
        colors: ["#fb923c", "#f43f5e"],
        onPress: () => router.push("/watch-party"),
      },
      {
        key: "curated-picks",
        title: t("home_curated_picks"),
        subtitle: t("home_curated_picks_sub"),
        icon: "film",
        colors: ["#22c55e", "#0f766e"],
        onPress: () => router.push("/taste-dna"),
      },
      {
        key: "local-favorites",
        title: t("home_local_favorites"),
        subtitle: t("home_local_favorites_sub"),
        icon: "location",
        colors: ["#38bdf8", "#6366f1"],
        onPress: () => router.push("/trending"),
      },
    ],
    [t],
  );

  return (
    <LinearGradient
      colors={["#181a3b", "#4f46e5", "#60a5fa"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Background Image */}
      <ImageBackground
        source={require("../../assets/Images/Home.png")}
        style={{ flex: 1 }}
        resizeMode="cover"
        imageStyle={{ opacity: 0.5 }} 
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
                <Text
                  style={{ color: "white", fontSize: 24, fontWeight: "800" }}
                >
                  {t("home_tagline")}
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
                    {t("home_new_badge")}
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
                {t("home_hero_subtitle")}
              </Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {[
                  { label: t("home_chip_personalized"), icon: "sparkles" },
                  { label: t("home_chip_social"), icon: "people" },
                  { label: t("home_chip_local"), icon: "location" },
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
                {t("home_explore_now")}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                {t("home_experiences_count")}
              </Text>
            </View>

            {/* Highlight Cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 8, paddingBottom: 6 }}
              style={{ marginBottom: 14 }}
            >
              {HIGHLIGHT_CARDS.map((card) => (
                <Pressable key={card.key} onPress={card.onPress}>
                  <LinearGradient
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
                        flexDirection: "row",
                        alignItems: "center",
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
                    </View>
                    <View>
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "700",
                          fontSize: 14,
                        }}
                      >
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
                </Pressable>
              ))}
            </ScrollView>

            {/* Feature Links */}
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
                {t("home_footer")}
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </LinearGradient>
  );
};

export default Home;
