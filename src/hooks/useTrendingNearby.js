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
      // Capture & save current location
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

      // Fetch trending movies
      const results = await fetchTrendingNearby(
        location.latitude,
        location.longitude,
        50000, // 50km radius
        20, // Limit to 20 results
      );

      console.log(`🎬 Found ${results?.length || 0} movies`);

      if (Array.isArray(results) && results.length > 0) {
        setMovies(results);
      } else {
        console.log("ℹ️ No movies found nearby");
        setMovies([]);
      }
    } catch (err) {
      console.error("❌ Trending Nearby Error:", err);
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
