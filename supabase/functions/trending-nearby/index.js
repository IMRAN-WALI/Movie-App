/* global Deno */
/* eslint-disable import/no-unresolved */
// supabase/functions/trending-nearby/index.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { lat, lng, radiusMeters = 50000 } = await req.json();

    // Validate input
    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(
        JSON.stringify({
          error: "lat and lng are required numbers",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Create Supabase client
    const supabase = createClient(
      
    );

    // Get nearby profiles using PostGIS
    const { data: nearbyProfiles, error: nearbyError } = await supabase.rpc(
      "get_nearby_profiles",
      {
        p_lat: lat,
        p_lng: lng,
        p_radius_meters: radiusMeters,
      },
    );

    if (nearbyError) {
      console.error("Nearby profiles error:", nearbyError);

      return new Response(
        JSON.stringify({
          error: "Failed to find nearby users",
          details: nearbyError.message,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const nearbyUserIds = (nearbyProfiles || []).map((p) => p.id);

    // If no nearby users, return global trending fallback
    if (nearbyUserIds.length === 0) {
      const { data: globalMovies, error: globalError } = await supabase
        .from("movies")
        .select("*")
        .order("vote_average", { ascending: false })
        .limit(10);

      if (globalError) {
        console.error("Global movies error:", globalError);
      }

      return new Response(
        JSON.stringify({
          city: null,
          results: globalMovies || [],
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Get ratings from nearby users
    const { data: ratings, error: ratingsError } = await supabase
      .from("ratings")
      .select("movie_id, rating")
      .in("user_id", nearbyUserIds);

    if (ratingsError) {
      console.error("Ratings error:", ratingsError);

      return new Response(
        JSON.stringify({
          error: "Failed to load ratings",
          details: ratingsError.message,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Aggregate trending scores
    const scoreMap = new Map();

    for (const row of ratings || []) {
      const current = scoreMap.get(row.movie_id) || {
        movie_id: row.movie_id,
        count: 0,
        total: 0,
      };

      current.count += 1;
      current.total += Number(row.rating || 0);

      scoreMap.set(row.movie_id, current);
    }

    // Rank by count and average rating
    const ranked = [...scoreMap.values()]
      .map((item) => ({
        movie_id: item.movie_id,
        rating_count: item.count,
        avg_rating: item.total / item.count,
        score: item.count * 2 + item.total / item.count,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const movieIds = ranked.map((r) => r.movie_id);

    if (movieIds.length === 0) {
      return new Response(
        JSON.stringify({
          city: nearbyProfiles?.[0]?.city || null,
          results: [],
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Fetch movie details
    const { data: movies, error: moviesError } = await supabase
      .from("movies")
      .select("*")
      .in("id", movieIds);

    if (moviesError) {
      console.error("Movies error:", moviesError);

      return new Response(
        JSON.stringify({
          error: "Failed to load movies",
          details: moviesError.message,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Preserve ranking order
    const movieMap = new Map((movies || []).map((m) => [m.id, m]));

    const orderedMovies = ranked
      .map((r) => {
        const movie = movieMap.get(r.movie_id);
        if (!movie) return null;

        return {
          ...movie,
          trending_score: r.score,
          nearby_rating_count: r.rating_count,
          nearby_avg_rating: Number(r.avg_rating.toFixed(1)),
        };
      })
      .filter(Boolean);

    return new Response(
      JSON.stringify({
        city: nearbyProfiles?.[0]?.city || null,
        results: orderedMovies,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Unhandled error:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
