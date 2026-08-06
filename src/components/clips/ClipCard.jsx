import React, { useState } from "react";
import { Alert, Text, Pressable, Share, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../i18n/LanguageContext";
import { deleteClip, toggleLike } from "../../services/clipService";

const ClipCard = ({ clip, onOpenComments, currentUserId, onDeleted }) => {
  const { t } = useLanguage();
  const player = useVideoPlayer(clip.video_url ?? "", (p) => {
    p.loop = true;
  });
  const [liked, setLiked] = useState(Boolean(clip.liked));
  const [likeCount, setLikeCount] = useState(clip.like_count ?? 0);
  const [deleting, setDeleting] = useState(false);

  const isOwner = currentUserId && clip.user_id === currentUserId;

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      await toggleLike(clip.id, next);
    } catch (e) {
      console.error("toggleLike error:", e);
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

  const handleDelete = () => {
    Alert.alert(
      t("clips_delete_confirm_title"),
      t("clips_delete_confirm_message"),
      [
        { text: t("profile_cancel"), style: "cancel" },
        {
          text: t("clips_delete"),
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteClip(clip.id);
              onDeleted?.(clip.id);
            } catch (e) {
              console.error("deleteClip error:", e);
              Alert.alert(t("common_error"), t("clips_delete_error"));
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View
      style={{ width: "100%", aspectRatio: 9 / 16, backgroundColor: "black" }}
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={() => (player.playing ? player.pause() : player.play())}
        onLongPress={isOwner ? handleDelete : undefined}
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

        {isOwner && (
          <Pressable
            onPress={handleDelete}
            disabled={deleting}
            style={{ alignItems: "center" }}
          >
            <Ionicons name="trash-outline" size={24} color="#f87171" />
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default ClipCard;
