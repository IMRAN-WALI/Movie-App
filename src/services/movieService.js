import { supabase } from "../lib/supabase";

// ============================================================
// SEARCH MOVIES
// ============================================================

export async function searchMovies(query) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const q = query.trim();

  const { data, error } = await supabase
    .from("movies")
    .select(
      `
      id,
      title,
      overview,
      poster_url,
      backdrop_url,
      release_date,
      genres,
      vote_average,
      runtime,
      video_type,
      downloadable
      `,
    )
    .ilike("title", `%${q}%`)
    .order("vote_average", {
      ascending: false,
      nullsFirst: false,
    })
    .limit(30);

  if (error) {
    console.error("❌ searchMovies error:", error);
    throw error;
  }

  return data ?? [];
}

// ============================================================
// GET MOVIE DETAILS
// ============================================================

export async function getMovieDetails(movieId) {
  if (!movieId) {
    throw new Error("Movie ID is required.");
  }

  const { data, error } = await supabase
    .from("movies")
    .select(
      `
      id,
      title,
      overview,
      poster_url,
      backdrop_url,
      release_date,
      genres,
      vote_average,
      runtime,
      video_type,
      downloadable
      `,
    )
    .eq("id", movieId)
    .single();

  if (error) {
    console.error("❌ getMovieDetails error:", error);
    throw error;
  }

  return data;
}

// ============================================================
// GET FULL MOVIE DOWNLOAD URL
//
// IMPORTANT:
// We DO NOT read video_url from the movies table anymore.
//
// Backend will:
// 1. Check movie
// 2. Check downloadable
// 3. Check video_type = full_movie
// 4. Get movie_storage_path
// 5. Generate a temporary Supabase signed URL
//
// ============================================================

export async function getMovieDownloadUrl(movieId) {
  if (!movieId) {
    throw new Error("Movie ID is required.");
  }

  console.log(
    "⬇️ Requesting FULL MOVIE download URL:",
    movieId,
  );

  /*
   * IMPORTANT:
   *
   * This endpoint must match your Flask backend:
   *
   * GET /movies/<movie_id>/download
   *
   * Your existing Supabase client cannot directly call
   * your Flask backend unless you have an API helper.
   *
   * Therefore we use the environment API URL below.
   */

  const API_URL =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_BACKEND_URL;

  if (!API_URL) {
    throw new Error(
      "Backend URL is missing. Add EXPO_PUBLIC_API_URL to your .env file.",
    );
  }

  // Get current Supabase session
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error(
      "❌ Session error:",
      sessionError,
    );

    throw new Error(
      "Could not verify your login session.",
    );
  }

  if (!session?.access_token) {
    throw new Error(
      "You are not logged in. Please login again.",
    );
  }

  const cleanBaseUrl = API_URL.replace(/\/+$/, "");

  const url = `${cleanBaseUrl}/movies/${movieId}/download`;

  console.log(
    "🌐 Download API:",
    url,
  );

  const response = await fetch(url, {
    method: "GET",

    headers: {
      Authorization: `Bearer ${session.access_token}`,
      Accept: "application/json",
    },
  });

  let result = null;

  try {
    result = await response.json();
  } catch (error) {
    console.error(
      "❌ Download API returned invalid JSON:",
      error,
    );
  }

  if (!response.ok) {
    console.error(
      "❌ Download API error:",
      response.status,
      result,
    );

    throw new Error(
      result?.error ||
        result?.message ||
        "Full movie is not available for download.",
    );
  }

  if (!result?.video_url) {
    console.error(
      "❌ Backend did not return video_url:",
      result,
    );

    throw new Error(
      "Full movie download URL was not returned by the server.",
    );
  }

  /*
   * Safety check:
   *
   * We only accept URLs returned as full_movie.
   */

  if (
    result.video_type &&
    result.video_type !== "full_movie"
  ) {
    throw new Error(
      "The selected download source is not a full movie.",
    );
  }

  console.log(
    "✅ FULL MOVIE URL RECEIVED:",
    {
      movieId: result.movie_id,
      title: result.title,
      videoType: result.video_type,
    },
  );

  return result;
}