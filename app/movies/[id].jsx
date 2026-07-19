import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { rateMovie } from "../../src/services/tasteService";
import {
  isMovieSaved,
  toggleSavedMovie,
} from "../../src/services/savedService";
import { safeBack } from "../../src/lib/safeBack";

const MovieDetails = () => {
  const { id } = useLocalSearchParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myRating, setMyRating] = useState(null);
  const [saved, setSaved] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("id", id)
        .single();

      if (!cancelled) {
        if (error) {
          Alert.alert("Couldn't load movie", error.message);
        } else {
          setMovie(data);
        }
        setLoading(false);
      }

      try {
        const alreadySaved = await isMovieSaved(id);
        if (!cancelled) setSaved(alreadySaved);
      } catch {
        // not fatal — bookmark state just stays false
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleRate = async (score) => {
    try {
      setMyRating(score);
      await rateMovie(id, score);
    } catch (e) {
      Alert.alert(
        "Couldn't save rating",
        e instanceof Error ? e.message : "Try again",
      );
    }
  };

  const handleToggleSave = async () => {
    const next = !saved;
    setSaved(next);
    setSavingBookmark(true);
    try {
      await toggleSavedMovie(id, next);
    } catch (e) {
      setSaved(!next);
      Alert.alert(
        "Couldn't update saved list",
        e instanceof Error ? e.message : "Try again",
      );
    } finally {
      setSavingBookmark(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#0f172a",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="white" />
      </SafeAreaView>
    );
  }

  if (!movie) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#0f172a",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#94a3b8" }}>Movie not found.</Text>
      </SafeAreaView>
    );
  }

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#0f172a" }}
      edges={["top"]}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            padding: 12,
          }}
        >
          <Pressable onPress={() => safeBack("/(tabs)")} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color="white" />
          </Pressable>

          <Pressable
            onPress={handleToggleSave}
            disabled={savingBookmark}
            hitSlop={12}
          >
            <Ionicons
              name={saved ? "bookmark" : "bookmark-outline"}
              size={24}
              color={saved ? "#818cf8" : "white"}
            />
          </Pressable>
        </View>

        {movie.backdrop_url && (
          <Image
            source={{ uri: movie.backdrop_url }}
            style={{ width: "100%", aspectRatio: 16 / 9 }}
          />
        )}

        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: "row", gap: 16 }}>
            {movie.poster_url && (
              <Image
                source={{ uri: movie.poster_url }}
                style={{
                  width: 100,
                  height: 150,
                  borderRadius: 12,
                  backgroundColor: "#1e293b",
                }}
              />
            )}
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={{ color: "white", fontSize: 22, fontWeight: "800" }}>
                {movie.title}
              </Text>
              <Text style={{ color: "#94a3b8", marginTop: 6 }}>
                {releaseYear} {movie.runtime ? `· ${movie.runtime} min` : ""}
              </Text>
              {movie.genres?.length > 0 && (
                <Text style={{ color: "#94a3b8", marginTop: 4 }}>
                  {movie.genres.join(", ")}
                </Text>
              )}
              {movie.vote_average != null && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 8,
                    gap: 4,
                  }}
                >
                  <Ionicons name="star" size={16} color="#facc15" />
                  <Text style={{ color: "white", fontWeight: "600" }}>
                    {movie.vote_average.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {movie.overview && (
            <Text style={{ color: "#cbd5e1", marginTop: 20, lineHeight: 20 }}>
              {movie.overview}
            </Text>
          )}

          <View style={{ flexDirection: "row", gap: 10, marginTop: 24 }}>
            <Pressable
              onPress={() => router.push(`/watch-party?movieId=${id}`)}
              style={{
                flex: 1,
                backgroundColor: "#4f46e5",
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="people-outline" size={18} color="white" />
              <Text style={{ color: "white", fontWeight: "700" }}>
                Watch Party
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push(`/clips/create?movieId=${id}`)}
              style={{
                flex: 1,
                backgroundColor: "#0ea5e9",
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="film-outline" size={18} color="white" />
              <Text style={{ color: "white", fontWeight: "700" }}>
                Make Clip
              </Text>
            </Pressable>
          </View>

          <Text
            style={{
              color: "white",
              fontWeight: "700",
              marginTop: 28,
              marginBottom: 10,
            }}
          >
            Rate this movie
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[2, 4, 6, 8, 10].map((score) => (
              <Pressable
                key={score}
                onPress={() => handleRate(score)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: myRating === score ? "#4f46e5" : "#1e293b",
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>
                  {score}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MovieDetails;
