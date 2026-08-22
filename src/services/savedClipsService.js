import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";

// --- REMOVED THE CRASHING LIBRARY ---
// import { trim } from "react-native-video-trim";

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
    const clipToDelete = clips.find((c) => c.id === clipId);

    if (clipToDelete?.videoUri?.startsWith(FileSystem.documentDirectory)) {
      await FileSystem.deleteAsync(clipToDelete.videoUri, {
        idempotent: true,
      }).catch((e) =>
        console.log("⚠️ Could not delete local clip file:", e?.message),
      );
    }

    const updated = clips.filter((c) => c.id !== clipId);
    await AsyncStorage.setItem(SAVED_CLIPS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Delete saved clip error:", error);
    throw error;
  }
};

/**
 * SAFE REPLACEMENT for trimming.
 * Since we cannot use react-native-video-trim in Expo Go,
 * this function currently just copies the file without trimming.
 *
 * TO ACTUALLY TRIM IN EXPO GO:
 * You must install and use '@ffmpeg/ffmpeg' with a Web Worker.
 */
export const trimVideoWithFFmpeg = async (inputUri, startTime, endTime) => {
  console.log(`✂️ Trim requested: ${startTime}s to ${endTime}s`);
  console.log(
    `⚠️ Note: Actual video trimming is disabled because "react-native-video-trim" was causing app crashes.`,
  );

  try {
    // 1. Create a safe directory
    const clipsDir = `${FileSystem.documentDirectory}clips/`;
    await FileSystem.makeDirectoryAsync(clipsDir, {
      intermediates: true,
    }).catch(() => {});

    // 2. Generate a filename for the "trimmed" video (currently just a copy)
    const trimmedUri = `${clipsDir}trimmed_${Date.now()}.mp4`;

    // 3. Copy the file (No actual trimming happens here to prevent the crash)
    await FileSystem.copyAsync({ from: inputUri, to: trimmedUri });

    console.log("✅ (Safe mode) Video copied instead of trimmed:", trimmedUri);

    return trimmedUri;
  } catch (error) {
    console.log("❌ Error during safe copy operation:", error);
    // Fallback to original if everything fails
    return inputUri;
  }
};

export const saveVideoToGallery = async (videoUri, start, end, caption) => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      throw new Error(
        "Permission to access media library was denied. Enable it in your phone's app settings.",
      );
    }

    console.log("💾 Saving video:", videoUri, "range", start, "-", end);

    const trimmedUri = await trimVideoWithFFmpeg(videoUri, start, end);

    const clipsDir = `${FileSystem.documentDirectory}clips/`;
    await FileSystem.makeDirectoryAsync(clipsDir, {
      intermediates: true,
    }).catch(() => {});

    const localCopyPath = `${clipsDir}${Date.now()}.mp4`;
    await FileSystem.copyAsync({ from: trimmedUri, to: localCopyPath });
    console.log("✅ Local app copy saved:", localCopyPath);

    let assetId = null;
    try {
      const asset = await MediaLibrary.createAssetAsync(trimmedUri);
      await MediaLibrary.createAlbumAsync("Movie Clips", asset, false);
      assetId = asset.id;
      console.log("✅ Also saved to gallery album, asset id:", assetId);
    } catch (galleryError) {
      // Not fatal — the app-local copy is what actually matters for the
      // in-app experience, so don't block save on gallery failing.
      console.log("⚠️ Gallery save failed (non-fatal):", galleryError);
    }

    const clipData = {
      videoUri: localCopyPath, // ← always use this for play/share in-app
      assetId,
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
