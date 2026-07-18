import { useEffect, useState } from "react";
import { getCurrentSession, onAuthStateChange } from "../services/authService";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Initial session
    getCurrentSession().then((s) => {
      if (mounted) {
        setSession(s);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const unsubscribe = onAuthStateChange((s) => {
      if (mounted) {
        setSession(s);
        setLoading(false);
      }
    }); 

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
  };
}
