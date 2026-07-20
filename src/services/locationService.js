import * as Location from "expo-location";
import { supabase } from "../lib/supabase";

/**
 * Capture user location and save it in Supabase.
 */
export async function captureAndStoreUserLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    return null;
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  const places = await Location.reverseGeocodeAsync({
    latitude,
    longitude,
  });

  const city =
    places[0]?.city ||
    places[0]?.subregion ||
    places[0]?.district ||
    places[0]?.region ||
    null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated.");
  }

  const { error } = await supabase.rpc("set_profile_location", {
    p_lat: latitude,
    p_lng: longitude,
    p_city: city,
  });

  if (error) {
    console.error(error);
    throw error;
  }

  return {
    latitude,
    longitude,
    city,
  };
}

/**
 * Get Trending Movies Near User
 */
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

  if (error) {
    console.error("Trending RPC Error:", error);
    throw error;
  }

  return data ?? [];
}
