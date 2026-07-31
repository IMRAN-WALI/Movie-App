import { supabase } from "../lib/supabase";

export async function fetchTasteProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("taste_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ✅ NOW CALLS DATABASE FUNCTION (not Edge Function)
export async function recomputeTasteProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  console.log("🔄 Recomputing taste profile for user:", user.id);

  const { data, error } = await supabase.rpc("recompute_taste_profile", {
    p_user_id: user.id,
  });

  if (error) {
    console.error("❌ recomputeTasteProfile RPC error:", error);
    throw error;
  }

  console.log("✅ Taste profile recomputed:", data);
  return data;
}

export async function rateMovie(movieId, score) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("ratings").upsert(
    {
      user_id: user.id,
      movie_id: movieId,
      rating: score,
    },
    { onConflict: "user_id,movie_id" },
  );

  if (error) throw error;

  // Fire and forget - recompute in background
  recomputeTasteProfile().catch((e) =>
    console.error("recomputeTasteProfile failed:", e),
  );
}

export async function markMovieCompleted(movieId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("watch_history").insert({
    user_id: user.id,
    movie_id: movieId,
    completed: true,
    progress_seconds: 0,
  });

  if (error) throw error;

  recomputeTasteProfile().catch((e) =>
    console.error("recomputeTasteProfile failed:", e),
  );
}
