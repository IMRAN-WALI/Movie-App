import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_KEY = "movie_app_settings";

export const DEFAULT_SETTINGS = {
  autoplayPreviews: true,
};

export async function getSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);

    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(raw);

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch (error) {
    console.error("❌ getSettings error:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings) {
  try {
    const nextSettings = {
      ...DEFAULT_SETTINGS,
      ...settings,
    };

    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));

    return nextSettings;
  } catch (error) {
    console.error("❌ saveSettings error:", error);
    throw error;
  }
}

export async function updateSetting(key, value) {
  try {
    const current = await getSettings();

    const updated = {
      ...current,
      [key]: value,
    };

    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));

    return updated;
  } catch (error) {
    console.error("❌ updateSetting error:", error);
    throw error;
  }
}

export async function resetSettings() {
  try {
    await AsyncStorage.removeItem(SETTINGS_KEY);

    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error("❌ resetSettings error:", error);
    throw error;
  }
}
