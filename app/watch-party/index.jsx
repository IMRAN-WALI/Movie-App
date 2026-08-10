import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createWatchParty,
  joinWatchParty,
} from "../../src/services/partyService";

const WatchPartyLobby = () => {
  const { movieId, movieTitle, posterUrl } = useLocalSearchParams();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!movieId) {
      // No movie attached to this screen yet — send the user to their
      // Downloads so they can pick a movie to host a party for.
      router.push({
        pathname: "/downloads",
        params: { selectFor: "party" },
      });
      return;
    }
    setLoading(true);
    try {
      console.log("🎬 Creating party for movie:", movieId);
      const party = await createWatchParty(movieId);
      console.log("✅ Party created:", party);

      router.push(`/watch-party/${party.id}`);
    } catch (e) {
      console.error("❌ Create party error:", e);
      Alert.alert("Couldn't create party", e.message || "Try again");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (inviteCode.trim().length < 4) {
      Alert.alert("Enter a valid invite code");
      return;
    }
    setLoading(true);
    try {
      console.log("🔍 Joining party with code:", inviteCode);
      const party = await joinWatchParty(inviteCode.trim());
      console.log("✅ Joined party:", party);

      // Navigate to party room
      router.push(`/watch-party/${party.id}`);
    } catch (e) {
      console.error("❌ Join error:", e);
      Alert.alert(
        "Couldn't join party",
        e.message || "Invalid or expired invite code",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={["#181a3b", "#4f46e5", "#60a5fa"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* WatchParty.png Background Image */}
        <ImageBackground
          source={require("../../assets/Images/WatchParty.png")}
          style={{ flex: 1 }}
          resizeMode="cover"
          imageStyle={{ opacity: 0.4 }}
        >
          <View style={{ flex: 1, padding: 24 }}>
            {/* Back Button */}
            <Pressable
              onPress={() => router.back()}
              style={{ marginBottom: 16 }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>

            {/* Movie Preview */}
            {movieId && (
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 24,
                  flexDirection: "row",
                }}
              >
                <Image
                  source={{
                    uri:
                      posterUrl ||
                      "https://image.tmdb.org/t/p/w500/sfQtVlIHljToOwYjhe21KPGzZWK.jpg",
                  }}
                  style={{ width: 80, height: 112, borderRadius: 8 }}
                  resizeMode="cover"
                />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text
                    style={{ color: "white", fontSize: 18, fontWeight: "bold" }}
                  >
                    {movieTitle || "Movie"}
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    Host a watch party for this movie
                  </Text>
                  <View style={{ flexDirection: "row", marginTop: 8 }}>
                    <View
                      style={{
                        backgroundColor: "rgba(34,197,94,0.2)",
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 999,
                      }}
                    >
                      <Text style={{ color: "#4ade80", fontSize: 11 }}>
                        🎬 Party Ready
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <Text
              style={{
                color: "white",
                fontSize: 32,
                fontWeight: "bold",
                marginBottom: 4,
              }}
            >
              Watch Party
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>
              Watch together, in sync, with voice and chat.
            </Text>

            {/* Host Button */}
            <Pressable
              onPress={handleCreate}
              disabled={loading}
              style={{
                backgroundColor: "white",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#4f46e5" />
              ) : (
                <Text
                  style={{ color: "#4f46e5", fontWeight: "bold", fontSize: 18 }}
                >
                  🎥 Host a Party
                </Text>
              )}
            </Pressable>

            <Text
              style={{
                color: "rgba(255,255,255,0.5)",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              — or join with a code —
            </Text>

            {/* Join Input */}
            <TextInput
              value={inviteCode}
              onChangeText={(t) => setInviteCode(t.toUpperCase())}
              placeholder="ABC123"
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoCapitalize="characters"
              maxLength={6}
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 16,
                color: "white",
                textAlign: "center",
                fontSize: 18,
                letterSpacing: 2,
                marginBottom: 16,
              }}
            />

            {/* Join Button */}
            <Pressable
              onPress={handleJoin}
              disabled={loading}
              style={{
                borderWidth: 1,
                borderColor: "white",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "white", fontWeight: "bold", fontSize: 18 }}
              >
                Join Party
              </Text>
            </Pressable>

            {/* Quick Tips */}
            <View style={{ marginTop: 32 }}>
              <Text
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 11,
                  textAlign: "center",
                }}
              >
                Tip: Share the invite code with friends to join your party
              </Text>
            </View>
          </View>
        </ImageBackground>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default WatchPartyLobby;
