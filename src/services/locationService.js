import * as Location from "expo-location";
import { invokeEdgeFunction, supabase } from "../lib/supabase";

/**
 * Requests location permission, reverse-geocodes to a city name, and stores
 * the point as a PostGIS geography(Point,4326) on the user's profile.
 */
export async function captureAndStoreUserLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return null;

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = position.coords;

  const places = await Location.reverseGeocodeAsync({ latitude, longitude });
  const city = places[0]?.city ?? places[0]?.subregion ?? null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // PostGIS geography columns need WKT construction — done server-side via
  // the set_profile_location RPC (see the SQL migration) so the client
  // never has to build WKT/EWKT strings itself.
  const { error } = await supabase.rpc("set_profile_location", {
    p_lat: latitude,
    p_lng: longitude,
    p_city: city,
  });

  if (error) throw error;

  return { city, latitude, longitude };
}

export async function fetchTrendingNearby(
  latitude,
  longitude,
  radiusMeters = 50000,
) {
  const { results } = await invokeEdgeFunction("trending-nearby", {
    lat: latitude,
    lng: longitude,
    radiusMeters,
  });
  return results;
}
