import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ClipTrimmer from "../../src/components/clips/ClipTrimmer";
import { useClipUpload } from "../../src/hooks/useClipUpload";

const CreateClipScreen = () => {
  const { movieId } = useLocalSearchParams();
  const [videoUri, setVideoUri] = useState(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [caption, setCaption] = useState("");
  const { uploading, progressLabel, error, submitClip } = useClipUpload();

  const pickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Allow access to your media library to pick a video.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setVideoUri(asset.uri);
      setDurationSeconds(asset.duration ? asset.duration / 1000 : 10);
    }
  };

  const handlePost = async () => {
    if (!videoUri) {
      Alert.alert("Pick a video first");
      return;
    }
    if (!movieId) {
      Alert.alert("Missing movie", "Open this screen from a movie page.");
      return;
    }
    const clip = await submitClip({
      localVideoUri: videoUri,
      movieId,
      startSeconds: start,
      endSeconds: end,
      caption: caption.trim() || undefined,
    });
    if (clip) {
      router.replace("/clips/feed");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ padding: 16, flex: 1 }}>
        <Text
          style={{
            color: "white",
            fontSize: 22,
            fontWeight: "800",
            marginBottom: 16,
          }}
        >
          New Clip
        </Text>

        {!videoUri ? (
          <Pressable
            onPress={pickVideo}
            style={{
              borderWidth: 1,
              borderColor: "#334155",
              borderStyle: "dashed",
              borderRadius: 16,
              paddingVertical: 60,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#94a3b8" }}>Tap to choose a video</Text>
          </Pressable>
        ) : (
          <ClipTrimmer
            videoUri={videoUri}
            totalDurationSeconds={durationSeconds}
            onChange={(s, e) => {
              setStart(s);
              setEnd(e);
            }}
          />
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

        {error && (
          <Text style={{ color: "#f87171", marginTop: 12 }}>{error}</Text>
        )}

        <Pressable
          onPress={handlePost}
          disabled={uploading || !videoUri}
          style={{
            marginTop: 24,
            backgroundColor: uploading ? "#4338ca" : "#4f46e5",
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          {uploading ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <ActivityIndicator color="white" />
              <Text style={{ color: "white", fontWeight: "700" }}>
                {progressLabel}
              </Text>
            </View>
          ) : (
            <Text style={{ color: "white", fontWeight: "700" }}>Post Clip</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default CreateClipScreen;
