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

        {loading && (
          <View style={{ paddingVertical: 60, alignItems: "center" }}>
            <ActivityIndicator color="white" />
          </View>
        )}

        {!loading && error && (
          <Text
            style={{ color: "#f87171", textAlign: "center", marginTop: 40 }}
          >
            {error}
          </Text>
        )}

        {!loading && !error && profile && <TasteCard profile={profile} />}

        {!loading && !error && (
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TasteDNAScreen;
