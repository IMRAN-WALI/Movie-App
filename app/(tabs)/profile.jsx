/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { signOut } from "../../src/services/authService";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      if (!cancelled) setEmail(user.email);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setProfile(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignOut = async () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert("Error", "Could not sign out. Please try again.");
          }
        },
      },
    ]);
  };

  const initials = (profile?.display_name || profile?.username || email || "?")
    .trim()
    .slice(0, 1)
    .toUpperCase();

  const MENU_ITEMS = [
    {
      icon: "color-palette-outline",
      label: "Taste DNA",
      onPress: () => router.push("/taste-dna"),
    },
    {
      icon: "location-outline",
      label: "Trending Near You",
      onPress: () => router.push("/trending"),
    },
    {
      icon: "film-outline",
      label: "My Clips",
      onPress: () => router.push("/clips/feed"),
    },
  ];

  if (loading) {
    return (
      <LinearGradient
        colors={["#3730a3", "#312e81"]}
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <ActivityIndicator color="white" size="large" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#3730a3", "#312e81"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={{ padding: 20 }}>
          <View
            style={{ alignItems: "center", marginTop: 20, marginBottom: 30 }}
          >
            <View
              style={{
                width: 90,
                height: 90,
                borderRadius: 45,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "rgba(255,255,255,0.25)",
              }}
            >
              <Text style={{ color: "white", fontSize: 32, fontWeight: "800" }}>
                {initials}
              </Text>
            </View>
            <Text
              style={{
                color: "white",
                fontSize: 20,
                fontWeight: "700",
                marginTop: 14,
              }}
            >
              {profile?.display_name || profile?.username || "Movie Fan"}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
              {email}
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  padding: 16,
                  gap: 14,
                }}
              >
                <Ionicons name={item.icon} size={20} color="white" />
                <Text style={{ color: "white", fontWeight: "600", flex: 1 }}>
                  {item.label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="rgba(255,255,255,0.5)"
                />
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={handleSignOut}
            style={{
              marginTop: 30,
              borderColor: "rgba(248,113,113,0.6)",
              borderWidth: 1.5,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#f87171", fontWeight: "700" }}>
              Sign Out
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Profile;
