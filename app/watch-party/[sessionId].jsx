import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ParticipantList from "../../src/components/watch-party/ParticipantList";
import PartyChat from "../../src/components/watch-party/PartyChat";
import VideoSyncPlayer from "../../src/components/watch-party/VideoSyncPlayer";
import { useLiveKitRoom } from "../../src/hooks/useLiveKitRoom";
import { useRealtimeParty } from "../../src/hooks/useRealtimeParty";
import { supabase } from "../../src/lib/supabase";
import { leaveWatchParty } from "../../src/services/partyService";

const WatchPartyRoom = () => {
  const { sessionId } = useLocalSearchParams();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [movieVideoUrl, setMovieVideoUrl] = useState(null);
  const [displayNames, setDisplayNames] = useState({});

  const {
    party,
    messages,
    participants,
    loading,
    sendMessage,
    broadcastPlayback,
  } = useRealtimeParty(sessionId ?? null);

  const isHost = !!party && !!currentUserId && party.host_id === currentUserId;

  const {
    connected: voiceConnected,
    speakingIdentities,
    isMuted,
    toggleMute,
    leave: leaveVoice,
  } = useLiveKitRoom(
    party?.livekit_room_name ?? null,
    currentUserId,
    displayNames[currentUserId ?? ""] ?? "Guest",
  );

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!party?.movie_id) return;
    supabase
      .from("movies")
      .select("video_url")
      .eq("id", party.movie_id)
      .single()
      .then(({ data }) => setMovieVideoUrl(data?.video_url ?? null));
  }, [party?.movie_id]);

  useEffect(() => {
    const ids = participants.map((p) => p.user_id);
    if (ids.length === 0) return;
    supabase
      .from("profiles")
      .select("id, display_name, username")
      .in("id", ids)
      .then(({ data }) => {
        if (!data) return;
        const map = {};
        data.forEach((p) => {
          map[p.id] = p.display_name || p.username;
        });
        setDisplayNames(map);
      });
  }, [participants]);

  const participantDisplays = useMemo(
    () =>
      participants.map((p) => ({
        userId: p.user_id,
        displayName: displayNames[p.user_id] ?? "…",
        avatarUrl: null,
        isMuted: p.is_muted,
      })),
    [participants, displayNames],
  );

  const nameForUserId = useCallback(
    (userId) => displayNames[userId] ?? "Guest",
    [displayNames],
  );

  const handleLeave = async () => {
    if (sessionId) await leaveWatchParty(sessionId);
    await leaveVoice();
    router.back();
  };

  const handleShareInvite = async () => {
    if (!party) return;
    await Share.share({
      message: `Join my watch party! Code: ${party.invite_code}`,
    });
  };

  if (loading || !party) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#0f172a",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="white" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#0f172a" }}
      edges={["top", "bottom"]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 12,
        }}
      >
        <Pressable onPress={handleLeave} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color="white" />
        </Pressable>
        <Pressable
          onPress={handleShareInvite}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Text style={{ color: "white", fontWeight: "700", letterSpacing: 2 }}>
            {party.invite_code}
          </Text>
          <Ionicons name="share-outline" size={18} color="white" />
        </Pressable>
        <Pressable onPress={toggleMute} hitSlop={12}>
          <Ionicons
            name={isMuted ? "mic-off" : "mic"}
            size={22}
            color={voiceConnected ? "white" : "#64748b"}
          />
        </Pressable>
      </View>

      {movieVideoUrl ? (
        <VideoSyncPlayer
          videoUrl={movieVideoUrl}
          party={party}
          isHost={isHost}
          onLocalChange={broadcastPlayback}
        />
      ) : (
        <View
          style={{
            width: "100%",
            aspectRatio: 16 / 9,
            backgroundColor: "black",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color="white" />
        </View>
      )}

      <View style={{ paddingVertical: 12 }}>
        <ParticipantList
          participants={participantDisplays}
          speakingIdentities={speakingIdentities}
        />
      </View>

      <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: "#1e293b" }}>
        <PartyChat
          messages={messages}
          currentUserId={currentUserId ?? ""}
          onSend={sendMessage}
          nameForUserId={nameForUserId}
        />
      </View>
    </SafeAreaView>
  );
};

export default WatchPartyRoom;
