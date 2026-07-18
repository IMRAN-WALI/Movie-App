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
        setPermissionDenied(true);
        setLoading(false);
        return;
      }
      setCity(location.city);
      const results = await fetchTrendingNearby(
        location.latitude,
        location.longitude,
      );
      setMovies(results);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load trending movies",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { movies, city, loading, error, permissionDenied, refresh: load };
}
