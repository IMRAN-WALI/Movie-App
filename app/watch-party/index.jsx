import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
} from "react-native";
import {
  createWatchParty,
  joinWatchParty,
} from "../../src/services/partyService";

const WatchPartyLobby = () => {
  const { movieId } = useLocalSearchParams();
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
      const party = await createWatchParty(movieId);
      router.push(`/watch-party/${party.id}`);
    } catch (e) {
      Alert.alert(
        "Couldn't create party",
        e instanceof Error ? e.message : "Try again",
      );
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
      const party = await joinWatchParty(inviteCode.trim());
      router.push(`/watch-party/${party.id}`);
    } catch (e) {
      Alert.alert(
        "Couldn't join party",
        e instanceof Error ? e.message : "Try again",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#4f46e5", "#312e81"]}
      style={{ flex: 1, padding: 24, justifyContent: "center" }}
    >
      <Text
        style={{
          color: "white",
          fontSize: 28,
          fontWeight: "800",
          marginBottom: 8,
        }}
      >
        Watch Party
      </Text>
      <Text style={{ color: "#c7d2fe", marginBottom: 32 }}>
        Watch together, in sync, with voice and chat.
      </Text>

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
          <ActivityIndicator />
        ) : (
          <Text style={{ fontWeight: "700", color: "#4338ca" }}>
            Host a Party
          </Text>
        )}
      </Pressable>

      <Text style={{ color: "#c7d2fe", textAlign: "center", marginBottom: 12 }}>
        — or join with a code —
      </Text>

      <TextInput
        value={inviteCode}
        onChangeText={(t) => setInviteCode(t.toUpperCase())}
        placeholder="ABC123"
        placeholderTextColor="rgba(255,255,255,0.5)"
        autoCapitalize="characters"
        maxLength={6}
        style={{
          backgroundColor: "rgba(255,255,255,0.12)",
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          color: "white",
          fontSize: 18,
          letterSpacing: 4,
          textAlign: "center",
          marginBottom: 16,
        }}
      />

      <Pressable
        onPress={handleJoin}
        disabled={loading}
        style={{
          borderColor: "white",
          borderWidth: 1.5,
          borderRadius: 16,
          paddingVertical: 16,
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "700", color: "white" }}>Join Party</Text>
      </Pressable>
    </LinearGradient>
  );
};

export default WatchPartyLobby;
