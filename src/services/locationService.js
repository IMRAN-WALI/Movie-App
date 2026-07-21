import * as Location from "expo-location";
import { supabase } from "../lib/supabase";

export async function captureAndStoreUserLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    const places = await Location.reverseGeocodeAsync({ latitude, longitude });

    const city =
      places[0]?.city || places[0]?.region || places[0]?.subregion || null;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    await supabase.rpc("set_profile_location", {
      p_lat: latitude,
      p_lng: longitude,
      p_city: city,
    });

    return { latitude, longitude, city };
  } catch (error) {
    return {
      latitude: 24.877569,
      longitude: 67.1682256,
      city: "Karachi",
      isFallback: true,
    };
  }
}

export async function fetchTrendingNearby(
  latitude,
  longitude,
  radiusMeters = 50000,
  resultLimit = 20,
) {
  const { data, error } = await supabase.rpc("trending_movies_near", {
    lat: latitude,
    lng: longitude,
    radius_meters: radiusMeters,
    result_limit: resultLimit,
  });
  if (error) throw error;
  return data ?? [];
}
