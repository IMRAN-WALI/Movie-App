import { useCallback, useState } from "react";
import { supabase } from "../lib/supabase";
import { createClip, uploadSourceVideo } from "../services/clipService";

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

        let sourceUrl = remoteVideoUrl;

        if (!sourceUrl) {
          if (!localVideoUri) throw new Error("No video selected.");
          setProgressLabel("Uploading video…");
          console.log("🔄 Uploading local video:", localVideoUri);
          sourceUrl = await uploadSourceVideo(localVideoUri, user.id);
          console.log("✅ Uploaded, public URL:", sourceUrl);
        } else {
          setProgressLabel("Using movie stream…");
        }

        setProgressLabel("Creating clip…");
        const clip = await createClip({
          movieId,
          sourceVideoUrl: sourceUrl,
          startSeconds,
          endSeconds,
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
