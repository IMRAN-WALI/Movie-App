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

    console.log("📍 FULL GEOCODE:", JSON.stringify(places[0], null, 2));

    const city =
      places[0]?.subregion ||
      places[0]?.district ||
      places[0]?.city ||
      places[0]?.region ||
      null; 

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "set_profile_location",
      {
        p_lat: latitude,
        p_lng: longitude,
        p_city: city,
      },
    );

    if (rpcError) {
      console.log("❌❌❌ set_profile_location RPC ERROR:", rpcError.message);
      console.log("❌❌❌ FULL RPC ERROR:", JSON.stringify(rpcError, null, 2));
    } else {
      console.log("✅ Location saved to profile:", {
        latitude,
        longitude,
        city,
      });
    }

    return { latitude, longitude, city };
  } catch (error) {
    console.log("❌❌❌ LOCATION ERROR:", error?.message);
    console.log("❌❌❌ FULL ERROR:", JSON.stringify(error, null, 2));
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
  console.log("🔍 Calling trending_movies_near with:", {
    lat: latitude,
    lng: longitude,
    radius_meters: radiusMeters,
    result_limit: resultLimit,
  });

  const { data, error } = await supabase.rpc("trending_movies_near", {
    lat: latitude,
    lng: longitude,
    radius_meters: radiusMeters,
    result_limit: resultLimit,
  });

  if (error) {
    console.log("❌❌❌ trending_movies_near RPC ERROR:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw error;
  }

  console.log("✅ trending_movies_near returned:", {
    dataLength: data?.length || 0,
    data: data,
  });

  return data ?? [];
}
