import { supabase } from "../lib/supabase";

export async function fetchSavedMovies() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("saved_movies")
    .select(
      "movie_id, created_at, movie:movies(id, title, poster_url, release_date, genres)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function isMovieSaved(movieId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("saved_movies")
    .select("movie_id")
    .eq("user_id", user.id)
    .eq("movie_id", movieId)
    .maybeSingle();

  return !!data;
}

export async function toggleSavedMovie(movieId, save) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (save) {
    const { error } = await supabase
      .from("saved_movies")
      .insert({ user_id: user.id, movie_id: movieId });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("saved_movies")
      .delete()
      .eq("user_id", user.id)
      .eq("movie_id", movieId);
    if (error) throw error;
  }
}
