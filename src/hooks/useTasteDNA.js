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

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("🔍 Fetching taste profile...");
      let existing = await fetchTasteProfile();
      console.log("📊 Existing profile:", existing);

      if (existing) {
        setProfile(existing);
        setLoading(false);
        return;
      }

      console.log("🔄 No profile found, recomputing...");
      const computed = await recomputeTasteProfile();
      console.log("✅ Computed profile:", computed);
      setProfile(computed);
    } catch (e) {
      console.error("❌ loadProfile error:", e);
      setError(e instanceof Error ? e.message : "Failed to load taste profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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
