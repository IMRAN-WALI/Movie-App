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

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("You must be logged in to post a clip.");

        // Works for both: a locally-picked gallery video, or a movie's
        // own remote stream url — react-native-video-trim's trim()
        // supports both local files and https:// urls as input.
        const inputUri = remoteVideoUrl || localVideoUri;
        if (!inputUri) throw new Error("No video selected.");

        // 1️⃣ Trim to the exact selected range BEFORE uploading anything.
        // This is the actual fix — previously we uploaded the full,
        // untrimmed video and only stored start/end as numbers in the
        // database, so the feed always showed the full clip.
        setProgressLabel("Trimming clip…");
        const trimmedLocalUri = await trimVideoToRange(
          inputUri,
          startSeconds,
          endSeconds,
        );

        // 2️⃣ Upload the already-trimmed file to Supabase Storage so it
        // has a stable public URL that other users can stream from (a
        // local device file path is useless to anyone but this device).
        setProgressLabel("Uploading clip…");
        console.log("🔄 Uploading trimmed video:", trimmedLocalUri);
        const sourceUrl = await uploadSourceVideo(trimmedLocalUri, user.id);
        console.log("✅ Uploaded, public URL:", sourceUrl);

        // 3️⃣ Create the DB row. The uploaded file IS the clip now (it's
        // already been cut to size), so we store 0 → duration rather
        // than the original start/end from the source video/stream.
        setProgressLabel("Creating clip…");
        const clip = await createClip({
          movieId,
          sourceVideoUrl: sourceUrl,
          startSeconds: 0,
          endSeconds: Math.round((endSeconds - startSeconds) * 10) / 10,
          caption,
        });

        console.log("✅ Clip created:", clip?.id);
        return clip;
      } catch (e) {
        console.log("❌ submitClip failed:", e);
        // Re-throw so the screen can show the exact message to the user
        // instead of failing silently.
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
