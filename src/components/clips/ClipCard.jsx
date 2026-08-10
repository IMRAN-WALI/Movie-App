import React, { useState } from "react";
import { Alert, Text, Pressable, Share, View, Dimensions } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../i18n/LanguageContext";
import { deleteClip, toggleLike } from "../../services/clipService";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "black",
        position: "relative",
      }}
    >
      {/* Video Player */}
      <Pressable
        style={{ flex: 1 }}
        onPress={() => (player.playing ? player.pause() : player.play())}
        onLongPress={isOwner ? handleDelete : undefined}
      >
        <VideoView
          player={player}
          style={{ flex: 1, width: "100%", height: "100%" }}
          nativeControls={false}
        />
      </Pressable>

      {/* Black Gradient Overlay taaki Title aur Buttons clear dikhein */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 150,
          backgroundColor: "rgba(0,0,0,0.4)",
        }}
      />

      {/* Title Text */}
      {clip.title && (
        <View
          style={{
            position: "absolute",
            bottom: 130, // Thoda upar kiya taaki neeche wali reel se overlap na ho
            left: 16,
            right: 90,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: "500",
              textShadowColor: "rgba(0, 0, 0, 0.75)",
              textShadowOffset: { width: -1, height: 1 },
              textShadowRadius: 10,
            }}
          >
            {clip.title}
          </Text>
        </View>
      )}

      {/* Side Buttons (Like, Comment, Share, Delete) */}
      <View
        style={{
          position: "absolute",
          bottom: 120, // Thoda upar kiya
          right: 12,
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Like Button */}
        <Pressable onPress={handleLike} style={{ alignItems: "center" }}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={32}
            color={liked ? "#f43f5e" : "white"}
          />
          <Text
            style={{
              color: "white",
              fontSize: 13,
              fontWeight: "600",
              marginTop: 2,
            }}
          >
            {likeCount}
          </Text>
        </Pressable>

        {/* Comment Button */}
        <Pressable
          onPress={() => onOpenComments(clip.id)}
          style={{ alignItems: "center" }}
        >
          <Ionicons name="chatbubble-outline" size={30} color="white" />
          <Text
            style={{
              color: "white",
              fontSize: 13,
              fontWeight: "600",
              marginTop: 2,
            }}
          >
            {clip.comment_count ?? 0}
          </Text>
        </Pressable>

        {/* Share Button */}
        <Pressable onPress={handleShare} style={{ alignItems: "center" }}>
          <Ionicons name="arrow-redo-outline" size={30} color="white" />
        </Pressable>

        {/* Delete Button (Only if owner) */}
        {isOwner && (
          <Pressable
            onPress={handleDelete}
            disabled={deleting}
            style={{ alignItems: "center" }}
          >
            <Ionicons name="trash-outline" size={26} color="#f87171" />
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default ClipCard;
