import * as FileSystem from "expo-file-system";
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

  const { data: clip, error } = await supabase
    .from("clips")
    .insert({
      user_id: user.id,
      movie_id: params.movieId,
      source_video_url: params.sourceVideoUrl,
      start_seconds: params.startSeconds,
      end_seconds: params.endSeconds,
      title: params.caption ?? null,
      status: "processing",
    })
    .select()
    .single();

  if (error) throw error;

  invokeEdgeFunction("clip-trim", { clipId: clip.id }).catch((e) =>
    console.error("clip-trim invoke failed:", e),
  );

  return clip;
}

export async function uploadSourceVideo(localUri, userId) {
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: "base64",
  });
  const path = `${userId}/${Date.now()}.mp4`;

  const { error } = await supabase.storage
    .from(SOURCE_BUCKET)
    .upload(path, decode(base64), { contentType: "video/mp4", upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(SOURCE_BUCKET).getPublicUrl(path);
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

export async function toggleLike(clipId, liked) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (liked) {
    await supabase
      .from("clip_likes")
      .insert({ clip_id: clipId, user_id: user.id });
  } else {
    await supabase
      .from("clip_likes")
      .delete()
      .eq("clip_id", clipId)
      .eq("user_id", user.id);
  }
}

export async function fetchComments(clipId) {
  const { data, error } = await supabase
    .from("clip_comments")
    .select("*")
    .eq("clip_id", clipId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function postComment(clipId, body) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("clip_comments").insert({
    clip_id: clipId,
    user_id: user.id,
    body,
  });

  if (error) throw error;
}
