import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  fetchSavedMovies,
  toggleSavedMovie,
} from "../../src/services/savedService";

const Saved = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSavedMovies();
      setItems(data);
    } catch (e) {
      console.error("fetchSavedMovies error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleRemove = async (movieId) => {
    setItems((prev) => prev.filter((i) => i.movie_id !== movieId));
    try {
      await toggleSavedMovie(movieId, false);
    } catch (e) {
      console.error("remove failed:", e);
      load();
    }
  };

  return (
    <LinearGradient
      colors={["#4f46e5", "#312e81"]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View
          style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}
        >
          <Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>
            Saved
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
            Your bookmarked movies and watchlist.
          </Text>
        </View>

        {loading && (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator color="white" />
          </View>
        )}

        {!loading && items.length === 0 && (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 40,
            }}
          >
            <Ionicons
              name="bookmark-outline"
              size={48}
              color="rgba(255,255,255,0.3)"
            />
            <Text
              style={{
                color: "rgba(255,255,255,0.6)",
                marginTop: 12,
                textAlign: "center",
              }}
            >
              Nothing saved yet — tap the bookmark icon on a movie to add it
              here.
            </Text>
          </View>
        )}

        <FlatList
          data={items}
          keyExtractor={(item) => item.movie_id}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/movies/${item.movie_id}`)}
              style={{
                flexDirection: "row",
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              {item.movie?.poster_url ? (
                <Image
                  source={{ uri: item.movie.poster_url }}
                  style={{ width: 72, height: 108 }}
                />
              ) : (
                <View
                  style={{
                    width: 72,
                    height: 108,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="film-outline"
                    size={24}
                    color="rgba(255,255,255,0.4)"
                  />
                </View>
              )}
              <View style={{ flex: 1, padding: 12, justifyContent: "center" }}>
                <Text
                  style={{ color: "white", fontWeight: "700", fontSize: 15 }}
                  numberOfLines={1}
                >
                  {item.movie?.title}
                </Text>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  {item.movie?.release_year}{" "}
                  {item.movie?.genres?.[0] ? `· ${item.movie.genres[0]}` : ""}
                </Text>
              </View>
              <Pressable
                onPress={() => handleRemove(item.movie_id)}
                hitSlop={10}
                style={{ padding: 16, justifyContent: "center" }}
              >
                <Ionicons name="bookmark" size={22} color="#f43f5e" />
              </Pressable>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Saved;
