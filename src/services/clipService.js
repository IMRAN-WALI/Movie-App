import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { invokeEdgeFunction, supabase } from "../lib/supabase";

const SOURCE_BUCKET = "movie-sources";

// src/services/clipService.js - createClip function mein yeh change karo

export async function createClip(params) {
  // FIX: Explicit userId parameter support
  let userId = params.userId;

  if (!userId) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      console.log("❌ Auth error in createClip:", userError);
      throw new Error("Authentication error. Please login again.");
    }
    if (!user) {
      throw new Error("Not authenticated");
    }
    userId = user.id;
  }

  console.log("📝 Creating clip for user:", userId);

  // Validate clip duration
  const duration = params.endSeconds - params.startSeconds;
  if (duration > 10) {
    throw new Error("Clips can be at most 10 seconds long");
  }
  if (duration <= 0) {
    throw new Error("Select a valid clip range before posting");
  }

  // CRITICAL FIX: Convert movieId to integer or null
  let movieId = params.movieId;

  // Agar string hai toh integer mein convert karo
  if (movieId !== null && movieId !== undefined) {
    // Agar string hai toh parseInt karo
    if (typeof movieId === "string") {
      movieId = parseInt(movieId, 10);
    }
    // Agar number hai toh check karo valid hai ya nahi
    if (typeof movieId === "number" && isNaN(movieId)) {
      console.warn(
        "⚠️ Invalid movieId (NaN), setting to null:",
        params.movieId,
      );
      movieId = null;
    }
  }

  console.log("📝 Final movieId for insert:", movieId, "type:", typeof movieId);

  // Insert clip with explicit user_id
  const { data: clip, error } = await supabase
    .from("clips")
    .insert({
      user_id: userId,
      movie_id: movieId, // ← Fixed: Properly converted
      source_video_url: params.sourceVideoUrl,
      video_url: params.sourceVideoUrl,
      start_seconds: params.startSeconds || 0,
      end_seconds: params.endSeconds || duration,
      title: params.caption || null,
      status: "ready",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.log("❌ createClip supabase error:", error);
    console.log("❌ Error details:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    if (error.code === "23502") {
      throw new Error(`Missing required field: ${error.message}`);
    }

    if (error.code === "42501") {
      throw new Error(
        "Permission denied. Please make sure you're logged in and have permission to post clips.",
      );
    }

    throw new Error(error.message || "Failed to save clip");
  }

  console.log("✅ Clip created successfully:", clip.id);
  return clip;
}

export async function uploadSourceVideo(localUri, userId) {
  try {
    console.log("📤 Reading file for upload:", localUri);
    console.log("📤 User ID for upload:", userId);

    if (!localUri) {
      throw new Error("No video file to upload");
    }

    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (!fileInfo.exists) {
      throw new Error("Video file does not exist at: " + localUri);
    }
    console.log("📤 File size:", fileInfo.size, "bytes");

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: "base64",
    });
    console.log("📤 File read, base64 length:", base64.length);

    // Create unique path
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const path = `${userId}/${timestamp}_${random}.mp4`;
    console.log("📤 Upload path:", path);

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(SOURCE_BUCKET)
      .upload(path, decode(base64), {
        contentType: "video/mp4",
        upsert: true,
        cacheControl: "3600",
      });

    if (error) {
      console.log("❌ Storage upload error:", error);
      console.log("❌ Error details:", {
        bucket: SOURCE_BUCKET,
        path: path,
        message: error.message,
        statusCode: error.statusCode,
      });

      // Specific error messages
      if (error.message.includes("bucket not found")) {
        throw new Error(
          `Storage bucket "${SOURCE_BUCKET}" not found. Please check Supabase configuration.`,
        );
      }
      if (error.message.includes("permission")) {
        throw new Error(
          "Permission denied. Check storage policies in Supabase.",
        );
      }

      throw new Error(error.message || "Failed to upload video to storage");
    }

    // Get public URL
    const { data } = supabase.storage.from(SOURCE_BUCKET).getPublicUrl(path);
    console.log("✅ Public URL:", data.publicUrl);

    if (!data.publicUrl) {
      throw new Error("Failed to generate public URL for uploaded video");
    }

    return data.publicUrl;
  } catch (error) {
    console.log("❌ uploadSourceVideo error:", error);
    throw error;
  }
}

export async function fetchClipFeed(page, pageSize = 10) {
  try {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    console.log("📋 Fetching clips: page", page, "range", from, "-", to);

    const { data, error } = await supabase
      .from("clips")
      .select("*")
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.log("❌ fetchClipFeed error:", error);
      throw new Error(error.message || "Failed to fetch clips");
    }

    console.log("📋 Fetched clips:", data?.length || 0);
    return data || [];
  } catch (error) {
    console.log("❌ fetchClipFeed error:", error);
    throw error;
  }
}

export async function fetchLikedClipIds(clipIds) {
  if (!clipIds || clipIds.length === 0) return [];

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      console.log("⚠️ Auth error in fetchLikedClipIds:", userError);
      return [];
    }
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
  } catch (error) {
    console.error("fetchLikedClipIds error:", error);
    return [];
  }
}

export async function toggleLike(clipId, liked) {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      console.log("❌ Auth error in toggleLike:", userError);
      throw new Error("Authentication error. Please login again.");
    }
    if (!user) throw new Error("Not authenticated");

    if (liked) {
      const { error } = await supabase
        .from("clip_likes")
        .insert({ clip_id: clipId, user_id: user.id });
      if (error) throw error;
      console.log("✅ Like added for clip:", clipId);
    } else {
      const { error } = await supabase
        .from("clip_likes")
        .delete()
        .eq("clip_id", clipId)
        .eq("user_id", user.id);
      if (error) throw error;
      console.log("✅ Like removed for clip:", clipId);
    }
  } catch (error) {
    console.log("❌ toggleLike error:", error);
    throw error;
  }
}

export async function fetchComments(clipId) {
  try {
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
  } catch (error) {
    console.log("❌ fetchComments error:", error);
    throw error;
  }
}

export async function postComment(clipId, body) {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      console.log("❌ Auth error in postComment:", userError);
      throw new Error("Authentication error. Please login again.");
    }
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("clip_comments")
      .insert({
        clip_id: clipId,
        user_id: user.id,
        body: body,
        created_at: new Date().toISOString(),
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
  } catch (error) {
    console.log("❌ postComment error:", error);
    throw error;
  }
}

export async function deleteClip(clipId) {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      console.log("❌ Auth error in deleteClip:", userError);
      throw new Error("Authentication error. Please login again.");
    }
    if (!user) throw new Error("Not authenticated");

    // Verify ownership first
    const { data: clip, error: fetchError } = await supabase
      .from("clips")
      .select("user_id")
      .eq("id", clipId)
      .single();

    if (fetchError) throw fetchError;

    if (clip.user_id !== user.id) {
      throw new Error("You don't have permission to delete this clip");
    }

    const { error } = await supabase.from("clips").delete().eq("id", clipId);

    if (error) throw error;

    console.log("✅ Clip deleted:", clipId);
  } catch (error) {
    console.log("❌ deleteClip error:", error);
    throw error;
  }
}
