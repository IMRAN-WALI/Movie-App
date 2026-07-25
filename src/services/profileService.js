import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { supabase } from "../lib/supabase";

const AVATAR_BUCKET = "avatars";

export async function fetchProfileStats() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const results = await Promise.allSettled([
    supabase
      .from("ratings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("watch_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("completed", true),
    supabase
      .from("watch_parties")
      .select("id", { count: "exact", head: true })
      .eq("host_id", user.id),
    supabase
      .from("saved_movies")
      .select("movie_id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const getCount = (result) =>
    result.status === "fulfilled" ? (result.value.count ?? 0) : 0;

  return {
    ratingsCount: getCount(results[0]),
    watchedCount: getCount(results[1]),
    partiesHosted: getCount(results[2]),
    savedCount: getCount(results[3]),
  };
}

export async function fetchWatchHistory() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("watch_history")
    .select(
      "id, movie_id, completed, progress_seconds, created_at, movie:movies(id, title, poster_url, release_date, genres, runtime)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateProfileDetails({ displayName, bio, avatarUrl }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updates = { updated_at: new Date().toISOString() };
  if (displayName !== undefined) updates.display_name = displayName;
  if (bio !== undefined) updates.bio = bio;
  if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadAvatar(localUri, userId) {
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: "base64",
  });
  const path = `${userId}/${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, decode(base64), { contentType: "image/jpeg", upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
