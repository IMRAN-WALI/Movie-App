import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
import en from "./translations/English";
import ur from "./translations/Urdu";
import ar from "./translations/Arabic";
import hi from "./translations/Hindi";

const STORAGE_KEY = "app_language";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
];

const DICTIONARIES = { en, ur, ar, hi };

const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
  ready: false,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("en");
  const [ready, setReady] = useState(false);

  // Load saved language on app start: local storage first (instant, offline),
  // then fall back to whatever is on the user's Supabase profile.
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && DICTIONARIES[stored]) {
          setLanguageState(stored);
        } else {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const { data } = await supabase
              .from("profiles")
              .select("language")
              .eq("id", user.id)
              .maybeSingle();
            if (data?.language && DICTIONARIES[data.language]) {
              setLanguageState(data.language);
              await AsyncStorage.setItem(STORAGE_KEY, data.language);
            }
          }
        }
      } catch (err) {
        console.error("❌ LanguageProvider load error:", err);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setLanguage = useCallback(async (code) => {
    if (!DICTIONARIES[code]) return;
    setLanguageState(code);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, code);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ language: code })
          .eq("id", user.id);
      }
    } catch (err) {
      console.error("❌ setLanguage persist error:", err);
    }
  }, []);

  const t = useCallback(
    (key) => {
      const dict = DICTIONARIES[language] || DICTIONARIES.en;
      return dict[key] ?? DICTIONARIES.en[key] ?? key;
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, ready }),
    [language, setLanguage, t, ready],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
