import { useCallback, useEffect, useState } from "react";
import {
  captureAndStoreUserLocation,
  fetchTrendingNearby,
} from "../services/locationService";

export function useTrendingNearby() {
  const [movies, setMovies] = useState([]);
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPermissionDenied(false);

    try {
      const location = await captureAndStoreUserLocation();

      if (!location) {
        console.log("📍 Location null — permission denied");
        setPermissionDenied(true);
        setMovies([]);
        setCity(null);
        return;
      }

      const cityName = location.city || "Nearby";
      setCity(cityName);

      console.log(`📍 Location: ${location.latitude}, ${location.longitude}`);
      console.log(`📍 City: ${cityName}`);

      const results = await fetchTrendingNearby(
        location.latitude,
        location.longitude,
        50000,
        20,
      );

      // 🔍 DEBUG: Check what we got
      console.log("🎬 Raw results:", JSON.stringify(results, null, 2));
      console.log("🎬 Results type:", typeof results);
      console.log("🎬 Is array?", Array.isArray(results));
      console.log("🎬 Results length:", results?.length);

      if (Array.isArray(results) && results.length > 0) {
        // 🔍 Check each movie object structure
        results.forEach((movie, index) => {
          console.log(`🎬 Movie ${index}:`, {
            id: movie.movie_id,
            title: movie.title,
            poster: movie.poster_url ? "Yes" : "No",
            watchCount: movie.watch_count,
            rating: movie.avg_rating,
            allKeys: Object.keys(movie),
          });
        });
        setMovies(results);
      } else {
        console.log("ℹ️ No movies found nearby");
        setMovies([]);
      }
    } catch (err) {
      console.error("❌ Trending Nearby Error:", err);
      console.error("❌ Error stack:", err?.stack);
      setMovies([]);
      setError(err?.message || "Failed to load trending movies.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    movies,
    city,
    loading,
    error,
    permissionDenied,
    refresh: load,
  };
}
