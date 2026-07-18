import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import DirectorAffinity from "../../components/taste-dna/DirectorAffinity";
import GenreBar from "../../components/taste-dna/GenreBar";

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

  const genreEntries = Object.entries(profile.genre_breakdown).sort(
    (a, b) => b[1] - a[1],
  );
  const eraEntries = Object.entries(profile.era_breakdown).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY }] }}>
      <LinearGradient
        colors={["#7c3aed", "#4f46e5", "#0ea5e9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 24 }}
      >
        <Text
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 13,
            letterSpacing: 1,
          }}
        >
          YOUR TASTE DNA
        </Text>
        <Text
          style={{
            color: "white",
            fontSize: 26,
            fontWeight: "800",
            marginTop: 4,
            marginBottom: 20,
          }}
        >
          {profile.top_summary || "Building your profile…"}
        </Text>

        <Text style={{ color: "white", fontWeight: "700", marginBottom: 10 }}>
          Genres
        </Text>
        {genreEntries.map(([genre, pct], i) => (
          <GenreBar key={genre} label={genre} percentage={pct} index={i} />
        ))}

        <Text
          style={{
            color: "white",
            fontWeight: "700",
            marginTop: 8,
            marginBottom: 10,
          }}
        >
          Directors you gravitate toward
        </Text>
        <DirectorAffinity directors={profile.director_affinity} />

        {eraEntries.length > 0 && (
          <>
            <Text
              style={{
                color: "white",
                fontWeight: "700",
                marginTop: 20,
                marginBottom: 10,
              }}
            >
              Favorite eras
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {eraEntries.map(([era, pct]) => (
                <View
                  key={era}
                  style={{
                    backgroundColor: "rgba(0,0,0,0.2)",
                    borderRadius: 16,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                  }}
                >
                  <Text style={{ color: "white" }}>
                    {era} · {Math.round(pct * 100)}%
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
            marginTop: 20,
          }}
        >
          Based on {profile.sample_size} rated or completed movies
        </Text>
      </LinearGradient>
    </Animated.View>
  );
};

export default TasteCard;
