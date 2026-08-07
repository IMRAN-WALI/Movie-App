import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { invokeEdgeFunction, supabase } from "../lib/supabase";

const SOURCE_BUCKET = "movie-sources";

export async function createClip(params) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (params.endSeconds - params.startSeconds > 10) {
    throw new Error("Clips can be at most 10 seconds long");
  }
  if (params.endSeconds - params.startSeconds <= 0) {
    throw new Error("Select a valid clip range before posting");
  }

  const { data: clip, error } = await supabase
    .from("clips")
    .insert({
      user_id: user.id,
      movie_id: params.movieId,
      source_video_url: params.sourceVideoUrl,
      video_url: params.sourceVideoUrl,
      start_seconds: params.startSeconds,
      end_seconds: params.endSeconds,
      title: params.caption ?? null,
      status: "ready",
    })
    .select()
    .single();

  if (error) {
    console.log("❌ createClip supabase error:", error);
    throw new Error(error.message || "Failed to save clip");
  }

  // NOTE: Trimming now happens CLIENT-SIDE (via react-native-video-trim,
  // see src/utils/trimVideo.js) before this function is ever called — the
  // uploaded file at params.sourceVideoUrl is already just the selected
  // clip range, not the full source video. We no longer depend on a
  // server-side "clip-trim" edge function to cut the video down, so the
  // clip is correct and playable immediately, with no async wait.
  //
  // If you have a real "clip-trim" edge function that does OTHER
  // post-processing (e.g. compression, thumbnail generation), it's still
  // safe to keep calling it here — it just isn't required for correctness
  // anymore. Uncomment if you want that:
  //
  // invokeEdgeFunction("clip-trim", { clipId: clip.id }).catch((e) =>
  //   console.log("clip-trim not available (non-fatal):", e?.message),
  // );

  return clip;
}

export async function uploadSourceVideo(localUri, userId) {
  console.log("📤 Reading file for upload:", localUri);
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: "base64",
  });
  console.log("📤 File read, base64 length:", base64.length);

  const path = `${userId}/${Date.now()}.mp4`;

  const { error } = await supabase.storage
    .from(SOURCE_BUCKET)
    .upload(path, decode(base64), { contentType: "video/mp4", upsert: true });

  if (error) {
    console.log("❌ Storage upload error:", error);
    throw new Error(error.message || "Failed to upload video");
  }

  const { data } = supabase.storage.from(SOURCE_BUCKET).getPublicUrl(path);
  console.log("✅ Public URL:", data.publicUrl);
  return data.publicUrl;
}

export async function fetchClipFeed(page, pageSize = 10) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("clips")
    .select("*")
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return data;
}

export async function fetchLikedClipIds(clipIds) {
  if (!clipIds || clipIds.length === 0) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("clip_likes")
    .select("clip_id")
    .eq("user_id", user.id)
    .in("clip_id", clipIds);

  if (error) {
    console.error("fetchLikedClipIds error:", error);
    return [];
  }
  return (data || []).map((row) => row.clip_id);
}

export async function toggleLike(clipId, liked) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (liked) {
    const { error } = await supabase
      .from("clip_likes")
      .insert({ clip_id: clipId, user_id: user.id });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("clip_likes")
      .delete()
      .eq("clip_id", clipId)
      .eq("user_id", user.id);
    if (error) throw error;
  }
}

export async function fetchComments(clipId) {
  const { data: comments, error } = await supabase
    .from("clip_comments")
    .select("*")
    .eq("clip_id", clipId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!comments || comments.length === 0) return [];

  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", userIds);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  return comments.map((c) => ({
    ...c,
    profile: profileMap.get(c.user_id) || null,
  }));
}

export async function postComment(clipId, body) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("clip_comments")
    .insert({
      clip_id: clipId,
      user_id: user.id,
      body,
    })
    .select()
    .single();

  if (error) throw error;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return { ...data, profile: profile || null };
}

export async function deleteClip(clipId) {
  const { error } = await supabase.from("clips").delete().eq("id", clipId);
  if (error) throw error;
}
