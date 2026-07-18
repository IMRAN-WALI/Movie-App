import React from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTrendingNearby } from "../../src/hooks/useTrendingNearby";
import TrendingList from "../../src/components/trending/TrendingList";

const TrendingScreen = () => {
  const { movies, city, loading, error, permissionDenied, refresh } =
    useTrendingNearby();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ padding: 16 }}>
        <Text style={{ color: "white", fontSize: 24, fontWeight: "800" }}>
          Trending Near You
        </Text>
        {city && <Text style={{ color: "#94a3b8", marginTop: 4 }}>{city}</Text>}
      </View>

      {loading && (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color="white" />
        </View>
      )}

      {!loading && permissionDenied && (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Text
            style={{ color: "#94a3b8", textAlign: "center", marginBottom: 16 }}
          >
            Enable location access to see what's trending near you.
          </Text>
          <Pressable
            onPress={refresh}
            style={{
              backgroundColor: "#4f46e5",
              borderRadius: 14,
              paddingVertical: 12,
              paddingHorizontal: 20,
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>Try Again</Text>
          </Pressable>
        </View>
      )}

      {!loading && error && (
        <Text style={{ color: "#f87171", textAlign: "center", marginTop: 20 }}>
          {error}
        </Text>
      )}

      {!loading && !error && !permissionDenied && (
        <TrendingList movies={movies} />
      )}
    </SafeAreaView>
  );
};

export default TrendingScreen;
