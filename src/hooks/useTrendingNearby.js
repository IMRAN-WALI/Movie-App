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
        setPermissionDenied(true);
        setMovies([]);
        return;
      }

      setCity(location.city);

      // Fetch nearby trending movies
      const results = await fetchTrendingNearby(
        location.latitude,
        location.longitude,
      );

      if (Array.isArray(results)) {
        setMovies(results);
      } else {
        setMovies([]);
      }
    } catch (err) {
      console.error("Trending Nearby Error:", err);

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
