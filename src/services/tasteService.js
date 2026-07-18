import { invokeEdgeFunction, supabase } from "../lib/supabase";

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

/** Triggers the taste-dna-compute edge function to recalculate the graph. */
export async function recomputeTasteProfile() {
  return invokeEdgeFunction("taste-dna-compute", {});
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
      score,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,movie_id" },
  );

  if (error) throw error;

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
