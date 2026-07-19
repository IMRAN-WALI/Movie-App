import React, { useState } from "react";
import { View, Text, Pressable, Share } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { toggleLike } from "../../services/clipService";

const ClipCard = ({ clip, onOpenComments }) => {
  const player = useVideoPlayer(clip.video_url ?? "", (p) => {
    p.loop = true;
  });
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(clip.like_count ?? 0);

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      await toggleLike(clip.id, next);
    } catch {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    }
  };

  const handleShare = async () => {
    if (!clip.video_url) return;
    await Share.share({
      message: clip.title ?? "Check out this clip",
      url: clip.video_url,
    });
  };

  return (
    <View
      style={{ width: "100%", aspectRatio: 9 / 16, backgroundColor: "black" }}
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={() => (player.playing ? player.pause() : player.play())}
      >
        <VideoView player={player} style={{ flex: 1 }} nativeControls={false} />
      </Pressable>

      {clip.title && (
        <View style={{ position: "absolute", bottom: 90, left: 16, right: 90 }}>
          <Text style={{ color: "white", fontSize: 15 }}>{clip.title}</Text>
        </View>
      )}

      <View
        style={{
          position: "absolute",
          bottom: 90,
          right: 12,
          alignItems: "center",
          gap: 20,
        }}
      >
        <Pressable onPress={handleLike} style={{ alignItems: "center" }}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={30}
            color={liked ? "#f43f5e" : "white"}
          />
          <Text style={{ color: "white", fontSize: 12, marginTop: 2 }}>
            {likeCount}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onOpenComments(clip.id)}
          style={{ alignItems: "center" }}
        >
          <Ionicons name="chatbubble-outline" size={28} color="white" />
          <Text style={{ color: "white", fontSize: 12, marginTop: 2 }}>
            {clip.comment_count ?? 0}
          </Text>
        </Pressable>
        <Pressable onPress={handleShare} style={{ alignItems: "center" }}>
          <Ionicons name="arrow-redo-outline" size={28} color="white" />
        </Pressable>
      </View>
    </View>
  );
};

export default ClipCard;
