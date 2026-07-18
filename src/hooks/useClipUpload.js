import { useCallback, useState } from "react";
import { supabase } from "../lib/supabase";
import { createClip, uploadSourceVideo } from "../services/clipService";

export function useClipUpload() {
  const [uploading, setUploading] = useState(false);
  const [progressLabel, setProgressLabel] = useState(null);
  const [error, setError] = useState(null);

  const submitClip = useCallback(
    async ({ localVideoUri, movieId, startSeconds, endSeconds, caption }) => {
      setUploading(true);
      setError(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        setProgressLabel("Uploading source video…");
        const sourceUrl = await uploadSourceVideo(localVideoUri, user.id);

        setProgressLabel("Creating clip…");
        const clip = await createClip({
          movieId,
          sourceVideoUrl: sourceUrl,
          startSeconds,
          endSeconds,
          caption,
        });

        setProgressLabel("Processing (this happens in the background)…");
        return clip;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create clip");
        return null;
      } finally {
        setUploading(false);
        setProgressLabel(null);
      }
    },
    [],
  );

  return { uploading, progressLabel, error, submitClip };
}
