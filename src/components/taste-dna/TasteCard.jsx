import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import DirectorAffinity from "../../components/taste-dna/DirectorAffinity";
import GenreProgressRing from "../../components/taste-dna/GenreProgressRing";

const RING_COLORS = [
  ["#ef4444", "#f97316"], // red → orange
  ["#f97316", "#eab308"], // orange → yellow
  ["#eab308", "#22c55e"], // yellow → green
  ["#22c55e", "#3b82f6"], // green → blue
  ["#3b82f6", "#6366f1"], // blue → indigo
  ["#6366f1", "#8b5cf6"], // indigo → violet
  ["#8b5cf6", "#ef4444"], // violet
  ["#a16207", "#78716c"], // brown → grey
  ["#78716c", "#f97316"], // grey
  ["#f97316", "#ffffff"], // white
];

const SectionHeading = ({ icon, title }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 7,
      backgroundColor: "rgba(255,255,255,0.12)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      borderRadius: 999,
      paddingVertical: 7,
      paddingHorizontal: 14,
      marginBottom: 14,
    }}
  >
    <Ionicons name={icon} size={13} color="#e0e7ff" />
    <Text
      style={{
        color: "white",
        fontWeight: "700",
        fontSize: 12.5,
        letterSpacing: 0.3,
      }}
    >
      {title}
    </Text>
  </View>
);

const TasteCard = ({ profile }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, translateY]);

  console.log("🎨 TasteCard rendering with profile:", profile?.genre_breakdown);

  const genreEntries = Object.entries(profile?.genre_breakdown || {}).sort(
    (a, b) => b[1] - a[1],
  );
  const eraEntries = Object.entries(profile?.era_breakdown || {}).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY }] }}>
      <LinearGradient
        colors={[
          "rgba(124,58,237,0.72)",
          "rgba(79,70,229,0.68)",
          "rgba(14,165,233,0.62)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 28,
          padding: 24,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.14)",
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="sparkles" size={18} color="white" />
          </View>
          <Text
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 12,
              fontWeight: "700",
              letterSpacing: 1.2,
            }}
          >
            YOUR TASTE DNA
          </Text>
        </View>

        {/* Genres */}
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <SectionHeading icon="pie-chart" title="GENRES" />
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              rowGap: 20,
            }}
          >
            {genreEntries.map(([genre, pct], i) => (
              <GenreProgressRing
                key={genre}
                label={genre}
                percentage={pct / 100}
                gradientId={`genre-gradient-${i}`}
                colors={RING_COLORS[i % RING_COLORS.length]}
              />
            ))}
          </View>
        </View>

        {/* Directors */}
        <SectionHeading icon="film" title="DIRECTORS YOU GRAVITATE TOWARD" />
        <DirectorAffinity directors={profile?.director_affinity || {}} />

        {/* Eras */}
        {eraEntries.length > 0 && (
          <>
            <View style={{ marginTop: 20 }}>
              <SectionHeading icon="time" title="FAVORITE ERAS" />
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {eraEntries.map(([era, pct]) => (
                <View
                  key={era}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: 999,
                    paddingVertical: 7,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.15)",
                  }}
                >
                  <Ionicons name="time-outline" size={13} color="white" />
                  <Text
                    style={{
                      color: "white",
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    {era} · {Math.round(pct)}%
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 12,
            marginTop: 24,
          }}
        >
          Based on {profile?.sample_size || 0} rated or completed movies
        </Text>
      </LinearGradient>
    </Animated.View>
  );
};

export default TasteCard;
