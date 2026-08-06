import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Share,
  Text,
  View,
} from "react-native";
import * as Sharing from "expo-sharing";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getSavedClips,
  deleteSavedClip,
} from "../../src/services/savedClipsService";

const SavedClipsScreen = () => {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(null);

  const loadClips = useCallback(async () => {
    setLoading(true);
    try {
      const saved = await getSavedClips();
      setClips(saved);
    } catch (error) {
      console.error("Load clips error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClips();
    }, [loadClips]),
  );

  const handleDelete = (clipId) => {
    Alert.alert("Delete Clip", "Are you sure you want to delete this clip?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSavedClip(clipId);
            setClips((prev) => prev.filter((c) => c.id !== clipId));
          } catch (error) {
            Alert.alert("Error", "Could not delete clip.");
          }
        },
      },
    ]);
  };

  const handleShare = async (clip) => {
    try {
      await Share.share({
        message:
          clip.caption ||
          `🎬 Check out this clip!\nDuration: ${clip.duration}s`,
        url: clip.videoUri,
        title: "Movie Clip",
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  // expo-sharing's shareAsync reliably opens the native Android/iOS share
  // sheet for a local content:// / file:// uri in Expo Go — this is more
  // reliable than launching a VIEW intent directly, which kept failing.
  // From the share sheet, pick any video player or "Gallery" to watch it.
  const handleOpenExternally = async (clip) => {
    setOpening(clip.id);
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        throw new Error("Sharing is not available on this device.");
      }
      await Sharing.shareAsync(clip.videoUri, {
        mimeType: "video/mp4",
        dialogTitle: "Open or play this clip",
      });
    } catch (error) {
      console.log("❌ handleOpenExternally error:", error);
      Alert.alert(
        "Couldn't open video",
        "Open your phone's Gallery/Photos app and look in the 'Movie Clips' album — the video is saved there.",
      );
    } finally {
      setOpening(null);
    }
  };

  const renderItem = ({ item }) => (
    <Pressable
      onPress={() => handleOpenExternally(item)}
      style={{
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 10,
          backgroundColor: "#1e293b",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {opening === item.id ? (
          <ActivityIndicator color="#818cf8" />
        ) : (
          <Ionicons name="play-circle" size={30} color="#818cf8" />
        )}
      </View>

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: "white", fontWeight: "700" }}>
          {item.caption || "Untitled Clip"}
        </Text>
        <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
          ⏱️ {item.duration}s • {new Date(item.savedAt).toLocaleDateString()}
        </Text>
        <Text style={{ color: "#64748b", fontSize: 11 }}>
          {item.startSeconds}s - {item.endSeconds}s
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            handleShare(item);
          }}
          style={{
            padding: 8,
            borderRadius: 8,
            backgroundColor: "rgba(37, 99, 235, 0.3)",
          }}
        >
          <Ionicons name="share-outline" size={18} color="#60a5fa" />
        </Pressable>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            handleDelete(item.id);
          }}
          style={{
            padding: 8,
            borderRadius: 8,
            backgroundColor: "rgba(239, 68, 68, 0.3)",
          }}
        >
          <Ionicons name="trash-outline" size={18} color="#f87171" />
        </Pressable>
      </View>
    </Pressable>
  );

  if (loading) {
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
      edges={["top"]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(255,255,255,0.08)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={20} color="white" />
        </Pressable>
        <Text style={{ color: "white", fontSize: 20, fontWeight: "800" }}>
          Saved Clips
        </Text>
        <Text style={{ color: "#64748b", fontSize: 14, marginLeft: "auto" }}>
          {clips.length} clips
        </Text>
      </View>

      <Text
        style={{
          color: "#64748b",
          fontSize: 12,
          paddingHorizontal: 16,
          marginBottom: 12,
        }}
      >
        Tap a clip, then choose a player from the menu to watch it
      </Text>

      {clips.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <Ionicons name="bookmark-outline" size={60} color="#334155" />
          <Text
            style={{
              color: "#64748b",
              fontSize: 16,
              marginTop: 16,
              textAlign: "center",
            }}
          >
            No saved clips yet
          </Text>
          <Text
            style={{
              color: "#475569",
              fontSize: 13,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            Trim and save clips from the create screen
          </Text>
          <Pressable
            onPress={() => router.push("/clips/create")}
            style={{
              marginTop: 20,
              backgroundColor: "#4f46e5",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>
              Create New Clip
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={clips}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default SavedClipsScreen;