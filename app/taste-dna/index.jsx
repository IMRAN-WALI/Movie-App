import React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TasteCard from "../../src/components/taste-dna/TasteCard";
import { useTasteDNA } from "../../src/hooks/useTasteDNA";

const TasteDNAScreen = () => {
  const { profile, loading, refreshing, error, refresh } = useTasteDNA();

  console.log("🔍 TasteDNAScreen state:", {
    loading,
    error,
    profile: !!profile,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="white"
          />
        }
      >
        <Text
          style={{
            color: "white",
            fontSize: 24,
            fontWeight: "800",
            marginBottom: 16,
          }}
        >
          Taste DNA
        </Text>

        {loading && !profile && (
          <View style={{ paddingVertical: 60, alignItems: "center" }}>
            <ActivityIndicator color="white" />
            <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 12 }}>
              Building your profile...
            </Text>
          </View>
        )}

        {!loading && error && (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <Text style={{ color: "#f87171", textAlign: "center" }}>
              {error}
            </Text>
            <Pressable
              onPress={refresh}
              style={{
                marginTop: 16,
                backgroundColor: "#4f46e5",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>
                Try Again
              </Text>
            </Pressable>
          </View>
        )}

        {!loading && !error && profile && (
          <>
            <TasteCard profile={profile} />
            <Pressable
              onPress={refresh}
              style={{
                marginTop: 20,
                alignSelf: "center",
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Text style={{ color: "white" }}>Recalculate</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TasteDNAScreen;
