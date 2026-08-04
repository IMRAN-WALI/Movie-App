import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
    <LinearGradient
      colors={["#1e1b4b", "#3730a3", "#312e81"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Decorative glow */}
      <View
        style={{
          position: "absolute",
          top: -70,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: "rgba(139,92,246,0.2)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -60,
          left: -60,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: "rgba(96,165,250,0.15)",
        }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="white"
            />
          }
        >
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.15)",
                }}
              >
                <Ionicons name="analytics" size={20} color="#a5b4fc" />
              </View>
              <Text
                style={{
                  color: "white",
                  fontSize: 26,
                  fontWeight: "800",
                }}
              >
                Taste DNA
              </Text>
            </View>
            <Text
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: 13,
                marginLeft: 2,
              }}
            >
              A profile of what you love to watch, built from your activity.
            </Text>
          </View>

          {/* Loading state */}
          {loading && !profile && (
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: 24,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
                paddingVertical: 60,
                alignItems: "center",
              }}
            >
              <ActivityIndicator color="white" size="large" />
              <Text
                style={{
                  color: "rgba(255,255,255,0.6)",
                  marginTop: 14,
                  fontSize: 14,
                }}
              >
                Building your profile...
              </Text>
            </View>
          )}

          {/* Error state */}
          {!loading && error && (
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: 24,
                borderWidth: 1,
                borderColor: "rgba(248,113,113,0.25)",
                paddingVertical: 40,
                paddingHorizontal: 24,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: "rgba(248,113,113,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <Ionicons name="alert-circle" size={26} color="#f87171" />
              </View>
              <Text
                style={{
                  color: "#fca5a5",
                  textAlign: "center",
                  fontSize: 14,
                  lineHeight: 20,
                }}
              >
                {error}
              </Text>
              <Pressable
                onPress={refresh}
                style={{ marginTop: 20, borderRadius: 14, overflow: "hidden" }}
              >
                <LinearGradient
                  colors={["#6366f1", "#4338ca"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingHorizontal: 22,
                    paddingVertical: 12,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>
                    Try Again
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {/* Profile content */}
          {!loading && !error && profile && (
            <>
              <TasteCard profile={profile} />

              <Pressable
                onPress={refresh}
                disabled={refreshing}
                style={{
                  marginTop: 24,
                  alignSelf: "center",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 11,
                  paddingHorizontal: 20,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                  opacity: refreshing ? 0.6 : 1,
                }}
              >
                <Ionicons name="refresh" size={16} color="#a5b4fc" />
                <Text
                  style={{ color: "white", fontWeight: "600", fontSize: 13 }}
                >
                  Recalculate
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default TasteDNAScreen;
