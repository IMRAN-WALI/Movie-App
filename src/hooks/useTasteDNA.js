import { useCallback, useEffect, useState } from "react";
import {
  fetchTasteProfile,
  recomputeTasteProfile,
} from "../services/tasteService";

export function useTasteDNA() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing = await fetchTasteProfile();
        if (cancelled) return;

        if (existing) {
          setProfile(existing);
          setLoading(false);
        } else {
          const computed = await recomputeTasteProfile();
          if (!cancelled) setProfile(computed);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to load taste profile",
          );
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const computed = await recomputeTasteProfile();
      setProfile(computed);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to refresh taste profile",
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  return { profile, loading, refreshing, error, refresh };
}
