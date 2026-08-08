import { supabase } from "../lib/supabase";

export async function searchMovies(query) {
  if (!query || query.trim().length === 0) return [];

  const q = query.trim();

  const { data, error } = await supabase
    .from("movies")
    .select(
      "id, title, poster_url, release_date, genres, vote_average, runtime, video_url",
    )
    .ilike("title", `%${q}%`)
    .order("vote_average", { ascending: false, nullsFirst: false })
    .limit(30);

  if (error) {
    console.error("searchMovies error:", error);
    throw error;
  }

  return data ?? [];
}
