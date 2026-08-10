import { useCallback, useState } from "react";
import { supabase } from "../lib/supabase";
import { createClip, uploadSourceVideo } from "../services/clipService";
import { trimVideoToRange } from "../utils/trimVideo";

export function useClipUpload() {
  const [uploading, setUploading] = useState(false);
  const [progressLabel, setProgressLabel] = useState(null);

  const submitClip = useCallback(
    async ({
      localVideoUri,
      remoteVideoUrl,
      movieId,
      startSeconds,
      endSeconds,
      caption,
    }) => {
      setUploading(true);
      try {
        console.log("🔄 submitClip start", {
          hasLocalVideo: !!localVideoUri,
          hasRemoteVideo: !!remoteVideoUrl,
          movieId,
          startSeconds,
          endSeconds,
        });

        // IMPORTANT FIX: Get user with proper error handling
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("❌ Auth error:", userError);
          throw new Error("Authentication error. Please login again.");
        }

        if (!user) {
          console.error("❌ No user found");
          throw new Error("You must be logged in to post a clip.");
        }

        console.log("✅ User authenticated:", user.id);

        // Works for both: a locally-picked gallery video, or a movie's
        // own remote stream url — react-native-video-trim's trim()
        // supports both local files and https:// urls as input.
        const inputUri = remoteVideoUrl || localVideoUri;
        if (!inputUri) throw new Error("No video selected.");

        // 1️⃣ Trim to the exact selected range BEFORE uploading anything.
        setProgressLabel("Trimming clip…");
        console.log(
          "🔄 Trimming video:",
          inputUri,
          "from",
          startSeconds,
          "to",
          endSeconds,
        );
        const trimmedLocalUri = await trimVideoToRange(
          inputUri,
          startSeconds,
          endSeconds,
        );
        console.log("✅ Trimmed:", trimmedLocalUri);

        // 2️⃣ Upload the already-trimmed file to Supabase Storage
        setProgressLabel("Uploading clip…");
        console.log("🔄 Uploading trimmed video to Supabase...");
        const sourceUrl = await uploadSourceVideo(trimmedLocalUri, user.id);
        console.log("✅ Uploaded, public URL:", sourceUrl);

        if (!sourceUrl) {
          throw new Error("Failed to upload video. Please try again.");
        }

        // 3️⃣ Create the DB row
        setProgressLabel("Creating clip…");
        console.log("🔄 Creating clip in database...");

        // Calculate final duration
        const duration = Math.round((endSeconds - startSeconds) * 10) / 10;

        const clip = await createClip({
          movieId: movieId || null, // Ensure null if undefined
          sourceVideoUrl: sourceUrl,
          startSeconds: 0,
          endSeconds: duration,
          caption: caption || null,
          userId: user.id, // Explicitly pass userId
        });

        console.log("✅ Clip created:", clip?.id);
        return clip;
      } catch (e) {
        console.log("❌ submitClip failed:", e);
        throw e;
      } finally {
        setUploading(false);
        setProgressLabel(null);
      }
    },
    [],
  );

  return { uploading, progressLabel, submitClip };
}
