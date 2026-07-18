import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { searchMovies } from "../../src/services/movieService";

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const data = await searchMovies(query);
        setResults(data);
      } catch (e) {
        console.error("search error:", e);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <LinearGradient
      colors={["#3b82f6", "#4338ca"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          <Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>
            Discover
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
            Find movies, actors, and curated collections.
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 16,
              paddingHorizontal: 14,
              marginTop: 20,
              height: 50,
            }}
          >
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.8)" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search movies..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              style={{ flex: 1, color: "white", marginLeft: 10, fontSize: 16 }}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={10}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color="rgba(255,255,255,0.7)"
                />
              </Pressable>
            )}
          </View>
        </View>

        {loading && (
          <View style={{ paddingTop: 40, alignItems: "center" }}>
            <ActivityIndicator color="white" />
          </View>
        )}

        {!loading && query.trim().length === 0 && (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 40,
            }}
          >
            <Ionicons
              name="film-outline"
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
              Start typing to search the movie catalog
            </Text>
          </View>
        )}

        {!loading && query.trim().length > 0 && results.length === 0 && (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: "rgba(255,255,255,0.6)" }}>
              No movies found for "{query}"
            </Text>
          </View>
        )}

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 14, paddingHorizontal: 20 }}
          contentContainerStyle={{ gap: 14, paddingTop: 20, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/movies/${item.id}`)}
              style={{ flex: 1 }}
            >
              <View
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  backgroundColor: "rgba(255,255,255,0.08)",
                }}
              >
                {item.poster_url ? (
                  <Image
                    source={{ uri: item.poster_url }}
                    style={{ width: "100%", aspectRatio: 2 / 3 }}
                  />
                ) : (
                  <View
                    style={{
                      width: "100%",
                      aspectRatio: 2 / 3,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="film-outline"
                      size={28}
                      color="rgba(255,255,255,0.4)"
                    />
                  </View>
                )}
                <View style={{ padding: 10 }}>
                  <Text
                    numberOfLines={1}
                    style={{ color: "white", fontWeight: "700" }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {item.release_year}{" "}
                    {item.genres?.[0] ? `· ${item.genres[0]}` : ""}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Search;
