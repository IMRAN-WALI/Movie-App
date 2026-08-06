import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ClipTrimmer from "../../src/components/clips/ClipTrimmer";
import { useClipUpload } from "../../src/hooks/useClipUpload";
import { useLanguage } from "../../src/i18n/LanguageContext";
import { safeBack } from "../../src/lib/safeBack";
import {
  saveVideoToGallery,
  trimVideoWithFFmpeg,
} from "../../src/services/savedClipsService";

const CreateClipScreen = () => {
  const {
    movieId,
    movieTitle,
    videoUrl,
    startSeconds: startParam,
  } = useLocalSearchParams();
  const { t } = useLanguage();

  const isMovieStream = Boolean(videoUrl);

  const [videoUri, setVideoUri] = useState(isMovieStream ? videoUrl : null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [caption, setCaption] = useState("");
  const [pickingVideo, setPickingVideo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { uploading, progressLabel, submitClip } = useClipUpload();

  const pickVideo = async () => {
    setPickingVideo(true);
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("📷 Media permission:", permission);

      if (!permission.granted) {
        Alert.alert(t("clips_permission"), t("clips_permission_msg"));
        return;
      }

      const mediaTypesOption = ImagePicker.MediaTypeOptions?.Videos ?? [
        "videos",
      ];

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypesOption,
        quality: 1,
        videoMaxDuration: 60,
      });

      console.log("📷 Picker result:", JSON.stringify(result, null, 2));

      if (result.canceled) {
        console.log("📷 User cancelled picker");
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        Alert.alert(
          "No video found",
          "Couldn't read the selected video. Please try a different one.",
        );
        return;
      }

      // NOTE: In Expo Go on Android, media library access is sandboxed —
      // we can't copy the file to our own cache (that's the
      // FileNotFoundException you saw). Instead, use the URI exactly as
      // the picker returns it. expo-video's native player can play
      // content:// URIs directly on Android without needing a copy.
      console.log(
        "📷 Using picker URI directly:",
        asset.uri,
        "duration(ms):",
        asset.duration,
      );

      const detectedDuration =
        asset.duration && asset.duration > 0 ? asset.duration / 1000 : 0;

      setVideoUri(asset.uri);
      setDurationSeconds(detectedDuration || 10);
      setStart(0);
      setEnd(0);
    } catch (e) {
      console.log("❌ pickVideo error:", e);
      Alert.alert(
        "Couldn't open gallery",
        e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setPickingVideo(false);
    }
  };

  const handleDurationDetected = useCallback(
    (seconds) => {
      setDurationSeconds(seconds);
      if (seconds > 0 && end === 0) {
        setEnd(Math.min(10, seconds));
      }
    },
    [end],
  );

  // ✅ SAVE - Trim with FFmpeg then save
  const handleSave = async () => {
    if (!videoUri) {
      Alert.alert("No video", "Please select a video first.");
      return;
    }

    try {
      setSaving(true);

      let finalStart = start;
      let finalEnd = end;
      if (finalEnd - finalStart <= 0) {
        finalStart = 0;
        finalEnd = Math.min(durationSeconds || 10, 10);
      }

      // ✅ Save to gallery with actual trimming
      const savedClip = await saveVideoToGallery(
        videoUri,
        finalStart,
        finalEnd,
        caption,
      );

      Alert.alert(
        "✅ Saved!",
        `Clip saved to gallery!\nTrim: ${finalStart.toFixed(1)}s - ${finalEnd.toFixed(1)}s (${(finalEnd - finalStart).toFixed(1)}s)`,
        [
          {
            text: "View Saved",
            onPress: () => router.push("/clips/saved"),
          },
          { text: "OK" },
        ],
      );
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", error.message || "Could not save clip. Try again.");
    } finally {
      setSaving(false);
    }
  };

  // ✅ SHARE - Share trimmed clip
  const handleShare = async () => {
    if (!videoUri) {
      Alert.alert("No video", "Please select a video first.");
      return;
    }

    try {
      setSharing(true);

      let finalStart = start;
      let finalEnd = end;
      if (finalEnd - finalStart <= 0) {
        finalStart = 0;
        finalEnd = Math.min(durationSeconds || 10, 10);
      }

      // ✅ Trim video with FFmpeg
      const trimmedUri = await trimVideoWithFFmpeg(
        videoUri,
        finalStart,
        finalEnd,
      );

      await Share.share({
        message:
          caption ||
          `🎬 Check out this clip!\nTrimmed: ${finalStart.toFixed(1)}s - ${finalEnd.toFixed(1)}s`,
        url: trimmedUri,
        title: "Movie Clip",
      });
    } catch (error) {
      console.error("Share error:", error);
      Alert.alert("Error", "Could not share clip.");
    } finally {
      setSharing(false);
    }
  };

  const handlePost = async () => {
    if (!videoUri) {
      Alert.alert(t("clips_pick_first"));
      return;
    }

    if (!movieId) {
      Alert.alert(
        "No movie selected",
        "This clip won't be linked to a movie. Continue anyway?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue",
            onPress: async () => {
              await doPost(null);
            },
          },
        ],
      );
      return;
    }

    await doPost(movieId);
  };

  const doPost = async (movieIdParam) => {
    let finalStart = start;
    let finalEnd = end;
    if (finalEnd - finalStart <= 0) {
      finalStart = 0;
      finalEnd = Math.min(durationSeconds || 10, 10);
    }

    try {
      const clip = await submitClip({
        localVideoUri: isMovieStream ? null : videoUri,
        remoteVideoUrl: isMovieStream ? videoUrl : null,
        movieId: movieIdParam,
        startSeconds: finalStart,
        endSeconds: finalEnd,
        caption: caption.trim() || undefined,
      });

      if (clip) {
        Alert.alert("Posted!", "Your clip is live in the feed.", [
          { text: "OK", onPress: () => router.replace("/clips/feed") },
        ]);
      }
    } catch (e) {
      console.log("❌ handlePost error:", e);
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Please try again.",
      );
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#0f172a" }}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
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
            onPress={() => safeBack("/clips/feed")}
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
            New Clip
          </Text>
          <Pressable
            onPress={() => router.push("/clips/saved")}
            style={{
              marginLeft: "auto",
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: "rgba(255,255,255,0.1)",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
            }}
          >
            <Ionicons name="bookmark" size={16} color="#a5b4fc" />
            <Text style={{ color: "#a5b4fc", fontSize: 12, fontWeight: "600" }}>
              Saved
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isMovieStream && movieTitle ? (
            <Text style={{ color: "#94a3b8", marginBottom: 12, fontSize: 13 }}>
              From: {movieTitle}
            </Text>
          ) : null}

          {!videoUri ? (
            <Pressable
              onPress={pickVideo}
              disabled={pickingVideo}
              style={{
                borderWidth: 1,
                borderColor: "#334155",
                borderStyle: "dashed",
                borderRadius: 16,
                paddingVertical: 60,
                alignItems: "center",
              }}
            >
              {pickingVideo ? (
                <ActivityIndicator color="#94a3b8" />
              ) : (
                <>
                  <Ionicons
                    name="videocam-outline"
                    size={28}
                    color="#64748b"
                    style={{ marginBottom: 8 }}
                  />
                  <Text style={{ color: "#94a3b8" }}>Pick a Video</Text>
                  <Text
                    style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}
                  >
                    Max 10 seconds clip
                  </Text>
                </>
              )}
            </Pressable>
          ) : (
            <View>
              <ClipTrimmer
                videoUri={videoUri}
                totalDurationSeconds={durationSeconds}
                initialStartSeconds={
                  isMovieStream ? Number(startParam || 0) : 0
                }
                onChange={(s, e) => {
                  setStart(s);
                  setEnd(e);
                }}
                onDurationDetected={handleDurationDetected}
              />

              {!isMovieStream && (
                <Pressable
                  onPress={pickVideo}
                  disabled={pickingVideo}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "rgba(15,23,42,0.85)",
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.15)",
                  }}
                >
                  {pickingVideo ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="swap-horizontal"
                        size={14}
                        color="white"
                      />
                      <Text
                        style={{
                          color: "white",
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        Change
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          )}

          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Add a caption…"
            placeholderTextColor="#64748b"
            style={{
              backgroundColor: "#1e293b",
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: "white",
              marginTop: 20,
            }}
            maxLength={200}
          />

          {/* Action Buttons */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
            <Pressable
              onPress={handleSave}
              disabled={saving || !videoUri}
              style={{
                flex: 1,
                backgroundColor: !videoUri ? "#334155" : "#059669",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
                opacity: !videoUri ? 0.5 : 1,
              }}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="white" />
                  <Text style={{ color: "white", fontWeight: "700" }}>
                    Save
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={handleShare}
              disabled={sharing || !videoUri}
              style={{
                flex: 1,
                backgroundColor: !videoUri ? "#334155" : "#2563eb",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
                opacity: !videoUri ? 0.5 : 1,
              }}
            >
              {sharing ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons
                    name="share-social-outline"
                    size={20}
                    color="white"
                  />
                  <Text style={{ color: "white", fontWeight: "700" }}>
                    Share
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={handlePost}
              disabled={uploading || !videoUri}
              style={{
                flex: 2,
                backgroundColor: !videoUri
                  ? "#334155"
                  : uploading
                    ? "#4338ca"
                    : "#4f46e5",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                opacity: !videoUri ? 0.5 : 1,
              }}
            >
              {uploading ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <ActivityIndicator color="white" />
                  <Text style={{ color: "white", fontWeight: "700" }}>
                    {progressLabel}
                  </Text>
                </View>
              ) : (
                <Text style={{ color: "white", fontWeight: "700" }}>
                  {movieId ? "Post Clip" : "Post"}
                </Text>
              )}
            </Pressable>
          </View>

          {videoUri && (
            <Text
              style={{
                color: "#94a3b8",
                fontSize: 12,
                marginTop: 10,
                textAlign: "center",
              }}
            >
              Clip: {start.toFixed(1)}s - {end.toFixed(1)}s (
              {(end - start).toFixed(1)}s)
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateClipScreen;
