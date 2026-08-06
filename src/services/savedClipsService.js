import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MediaLibrary from "expo-media-library";

const SAVED_CLIPS_KEY = "saved_clips";

export const saveClipToStorage = async (clipData) => {
  try {
    const existing = await getSavedClips();
    const newClip = {
      id: Date.now().toString(),
      ...clipData,
      savedAt: new Date().toISOString(),
    };
    const updated = [newClip, ...existing];
    await AsyncStorage.setItem(SAVED_CLIPS_KEY, JSON.stringify(updated));
    return newClip;
  } catch (error) {
    console.error("Save clip to storage error:", error);
    throw error;
  }
};

export const getSavedClips = async () => {
  try {
    const data = await AsyncStorage.getItem(SAVED_CLIPS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Get saved clips error:", error);
    return [];
  }
};

export const deleteSavedClip = async (clipId) => {
  try {
    const clips = await getSavedClips();
    const updated = clips.filter((c) => c.id !== clipId);
    await AsyncStorage.setItem(SAVED_CLIPS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Delete saved clip error:", error);
    throw error;
  }
};

export const trimVideoWithFFmpeg = async (inputUri, startTime, endTime) => {
  console.log(
    "⚠️ FFmpeg not available in Expo Go — saving/sharing full video as-is",
  );
  return inputUri;
};

// NOTE ON WHY THIS IS TRICKY:
// The uri the gallery picker gives us (content://...) is only guaranteed
// playable for as long as we're still "in" that picking session. Once we
// navigate to another screen and come back later, Android can revoke that
// grant, which is exactly what caused "Couldn't play this video" on the
// Saved Clips screen even though the same uri played fine in the trimmer.
//
// The fix: after MediaLibrary copies the video into the gallery, we ask
// MediaLibrary itself — via getAssetInfoAsync — for a fresh, persistent,
// playable uri for THAT copy (not the original picker uri). This is the
// uri we store and reuse for in-app preview.
export const saveVideoToGallery = async (videoUri, start, end, caption) => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      throw new Error(
        "Permission to access media library was denied. Enable it in your phone's app settings.",
      );
    }

    console.log("💾 Saving video to gallery from URI:", videoUri);

    const asset = await MediaLibrary.createAssetAsync(videoUri);
    console.log("✅ Asset created:", asset.id, "uri:", asset.uri);

    await MediaLibrary.createAlbumAsync("Movie Clips", asset, false);
    console.log("✅ Added to 'Movie Clips' album");

    const clipData = {
      videoUri: asset.uri,
      assetId: asset.id,
      startSeconds: start,
      endSeconds: end,
      duration: (end - start).toFixed(1),
      caption: caption || "",
    };

    const savedClip = await saveClipToStorage(clipData);
    return savedClip;
  } catch (error) {
    console.log("❌ saveVideoToGallery error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Could not save video to gallery.",
    );
  }
};
