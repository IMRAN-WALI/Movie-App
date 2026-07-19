import { supabase } from "../lib/supabase";

export async function searchMovies(query) {
  if (!query || query.trim().length === 0) return [];

  const { data, error } = await supabase
    .from("movies")
    .select("id, title, poster_url, release_date, genres")
    .ilike("title", `%${query.trim()}%`)
    .limit(24);

  if (error) throw error;
  return data;
}
