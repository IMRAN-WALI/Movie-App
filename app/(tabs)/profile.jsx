/* eslint-disable no-unused-vars */
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { signOut } from "../../src/services/authService";
import { fetchProfileStats } from "../../src/services/profileService";

const StatCard = ({ label, value, icon }) => (
  <View
    style={{
      flex: 1,
      backgroundColor: "rgba(255,255,255,0.08)",
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
    }}
  >
    <Ionicons name={icon} size={18} color="#a5b4fc" />
    <Text
      style={{ color: "white", fontSize: 18, fontWeight: "800", marginTop: 6 }}
    >
      {value}
    </Text>
    <Text
      style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 }}
    >
      {label}
    </Text>
  </View>
);

const MenuSection = ({ title, children }) => (
  <View style={{ marginBottom: 24 }}>
    <Text
      style={{
        color: "rgba(255,255,255,0.5)",
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1,
        marginBottom: 10,
        marginLeft: 4,
        textTransform: "uppercase",
      }}
    >
      {title}
    </Text>
    <View
      style={{ backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16 }}
    >
      {children}
    </View>
  </View>
);

const MenuItem = ({ icon, label, onPress, danger, isLast }) => (
  <Pressable
    onPress={onPress}
    style={{
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 15,
      paddingHorizontal: 16,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: "rgba(255,255,255,0.06)",
      gap: 14,
    }}
  >
    <Ionicons name={icon} size={20} color={danger ? "#f87171" : "white"} />
    <Text
      style={{
        color: danger ? "#f87171" : "white",
        fontWeight: "600",
        flex: 1,
        fontSize: 15,
      }}
    >
      {label}
    </Text>
    {!danger && (
      <Ionicons
        name="chevron-forward"
        size={18}
        color="rgba(255,255,255,0.4)"
      />
    )}
  </Pressable>
);

const Profile = () => {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setEmail(user.email);

    const [{ data: profileData }, statsData] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      fetchProfileStats().catch(() => null),
    ]);

    setProfile(profileData);
    setStats(statsData);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View
            style={{ alignItems: "center", marginTop: 10, marginBottom: 24 }}
          >
            <View style={{ position: "relative" }}>
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: "rgba(255,255,255,0.25)",
                  overflow: "hidden",
                }}
              >
                {profile?.avatar_url ? (
                  <Image
                    source={{ uri: profile.avatar_url }}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <Text
                    style={{ color: "white", fontSize: 34, fontWeight: "800" }}
                  >
                    {initials}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={() => router.push("/profile/edit")}
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: "#6366f1",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: "#312e81",
                }}
              >
                <Ionicons name="pencil" size={14} color="white" />
              </Pressable>
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
            {profile?.username && (
              <Text style={{ color: "#a5b4fc", marginTop: 2, fontSize: 13 }}>
                @{profile.username}
              </Text>
            )}
            <Text
              style={{
                color: "rgba(255,255,255,0.6)",
                marginTop: 4,
                fontSize: 13,
              }}
            >
              {email}
            </Text>
            {profile?.bio ? (
              <Text
                style={{
                  color: "rgba(255,255,255,0.75)",
                  marginTop: 10,
                  fontSize: 13,
                  textAlign: "center",
                  paddingHorizontal: 20,
                  lineHeight: 18,
                }}
              >
                {profile.bio}
              </Text>
            ) : null}
          </View>

          {/* Stats */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 28 }}>
            <StatCard
              label="Watched"
              value={stats?.watchedCount ?? 0}
              icon="film-outline"
            />
            <StatCard
              label="Rated"
              value={stats?.ratingsCount ?? 0}
              icon="star-outline"
            />
            <StatCard
              label="Parties"
              value={stats?.partiesHosted ?? 0}
              icon="people-outline"
            />
            <StatCard
              label="Saved"
              value={stats?.savedCount ?? 0}
              icon="bookmark-outline"
            />
          </View>

          {/* Activity */}
          <MenuSection title="Your Activity">
            <MenuItem
              icon="time-outline"
              label="Watch History"
              onPress={() => router.push("/profile/history")}
              isLast
            />
          </MenuSection>

          {/* Account */}
          <MenuSection title="Account">
            <MenuItem
              icon="person-outline"
              label="Edit Profile"
              onPress={() => router.push("/profile/edit")}
            />
            <MenuItem
              icon="lock-closed-outline"
              label="Change Password"
              onPress={() => router.push("/auth/forgot-password")}
              isLast
            />
          </MenuSection>

          <Pressable
            onPress={handleSignOut}
            style={{
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

          <Text
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 11,
              textAlign: "center",
              marginTop: 20,
            }}
          >
            Movie App v1.0.0
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Profile;
