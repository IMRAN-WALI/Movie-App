import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
      Alert.alert(
        "Pick a movie first",
        'Open a movie and choose "Watch Party" to host one.',
      );
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
    <SafeAreaView className="flex-1">
      <LinearGradient
        colors={["#181a3b", "#4f46e5", "#60a5fa"]}
        className="flex-1 p-6"
      >
        {/* Back Button */}
        <Pressable onPress={() => router.back()} className="mb-4">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>

        {/* Movie Preview */}
        {movieId && (
          <View className="bg-white/10 rounded-2xl p-4 mb-6 flex-row">
            <Image
              source={{
                uri:
                  posterUrl ||
                  "https://image.tmdb.org/t/p/w500/sfQtVlIHljToOwYjhe21KPGzZWK.jpg",
              }}
              className="w-20 h-28 rounded-lg"
              resizeMode="cover"
            />
            <View className="flex-1 ml-4">
              <Text className="text-white text-lg font-bold">
                {movieTitle || "Movie"}
              </Text>
              <Text className="text-white/70 text-sm mt-1">
                Host a watch party for this movie
              </Text>
              <View className="flex-row mt-2">
                <View className="bg-green-500/20 px-3 py-1 rounded-full">
                  <Text className="text-green-400 text-xs">🎬 Party Ready</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <Text className="text-white text-3xl font-bold mb-2">Watch Party</Text>
        <Text className="text-white/70 mb-6">
          Watch together, in sync, with voice and chat.
        </Text>

        {/* Host Button */}
        <Pressable
          onPress={handleCreate}
          disabled={loading}
          className="bg-white rounded-2xl py-4 items-center mb-6"
        >
          {loading ? (
            <ActivityIndicator color="#4f46e5" />
          ) : (
            <Text className="text-indigo-700 font-bold text-lg">
              🎥 Host a Party
            </Text>
          )}
        </Pressable>

        <Text className="text-white/50 text-center mb-4">
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
          className="bg-white/10 rounded-2xl py-4 px-4 text-white text-center text-lg tracking-widest mb-4"
        />

        {/* Join Button */}
        <Pressable
          onPress={handleJoin}
          disabled={loading}
          className="border border-white rounded-2xl py-4 items-center"
        >
          <Text className="text-white font-bold text-lg">Join Party</Text>
        </Pressable>

        {/* Quick Tips */}
        <View className="mt-8">
          <Text className="text-white/40 text-xs text-center">
            💡 Tip: Share the invite code with friends to join your party
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default WatchPartyLobby;
