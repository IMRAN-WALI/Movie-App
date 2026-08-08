import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTrendingNearby } from "../../src/hooks/useTrendingNearby";
import { useDownloads } from "../../src/hooks/useDownloads";
import { downloadStates } from "../../src/services/downloadService";
import { supabase } from "../../src/lib/supabase";

export default function TrendingScreen() {
  const { movies, city, loading, error, permissionDenied, refresh } =
    useTrendingNearby();
  const { downloads, downloadMovie } = useDownloads();
  const [fetchingMovieId, setFetchingMovieId] = useState(null);

  // Maps movie_id -> boolean (does this movie have a downloadable video_url?)
  // undefined = we haven't checked yet.
  const [videoAvailability, setVideoAvailability] = useState({});

  // Trending results don't include video_url, so once the list loads we
  // batch-check which of these movies actually have a playable/downloadable
  // video, and use that to grey out the download button up front.
  useEffect(() => {
    if (!movies || movies.length === 0) return;

    let cancelled = false;

    (async () => {
      const ids = movies.map((m) => m.movie_id);
      console.log("🔍 Checking video for movie IDs:", ids);

      const { data, error: fetchError } = await supabase
        .from("movies")
        .select("id, video_url")
        .in("id", ids);

      if (cancelled) return;

      if (fetchError) {
        console.error("❌ videoAvailability fetch error:", fetchError);
        return;
      }

      console.log("📦 Raw data from Supabase:", data);

      const map = {};
      (data || []).forEach((row) => {
        map[row.id] = Boolean(row.video_url);
        console.log(`Movie ${row.id} → has video: ${Boolean(row.video_url)}`);
      });
      setVideoAvailability((prev) => ({ ...prev, ...map }));
    })();

    return () => {
      cancelled = true;
    };
  }, [movies]);

  const handleMoviePress = (movie) => {
    router.push({
      pathname: "/watch-party",
      params: {
        movieId: movie.movie_id.toString(),
        movieTitle: movie.title,
        posterUrl: movie.poster_url,
        watchCount: movie.watch_count,
        avgRating: movie.avg_rating,
      },
    });
  };

  const getDownloadForMovie = (movieId) =>
    downloads.find((d) => String(d.movieId) === String(movieId));

  const handleDownloadPress = async (movie) => {
    const hasVideo = videoAvailability[movie.movie_id];
    if (hasVideo === false) return; // disabled — nothing to do
    if (hasVideo === undefined) return; // still checking availability

    const existing = getDownloadForMovie(movie.movie_id);

    // Already downloaded — go straight to Downloads
    if (existing?.status === downloadStates.COMPLETED) {
      router.push("/downloads");
      return;
    }

    // Already queued/downloading — just take them to Downloads to see progress
    if (
      existing &&
      (existing.status === downloadStates.DOWNLOADING ||
        existing.status === downloadStates.QUEUED)
    ) {
      router.push("/downloads");
      return;
    }

    setFetchingMovieId(movie.movie_id);
    try {
      const { data, error: fetchError } = await supabase
        .from("movies")
        .select("video_url")
        .eq("id", movie.movie_id)
        .single();

      if (fetchError || !data?.video_url) {
        Alert.alert(
          "Not available",
          "This movie doesn't have a downloadable video yet.",
        );
        return;
      }

      await downloadMovie(
        movie.movie_id,
        movie.title,
        movie.poster_url,
        data.video_url,
      );

      Alert.alert("Download started", `"${movie.title}" is downloading.`, [
        { text: "OK", style: "cancel" },
        { text: "View Downloads", onPress: () => router.push("/downloads") },
      ]);
    } catch (e) {
      console.error("❌ Trending download error:", e);
      Alert.alert(
        "Couldn't start download",
        e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setFetchingMovieId(null);
    }
  };

  const renderDownloadIcon = (movie) => {
    const isFetching = fetchingMovieId === movie.movie_id;
    const hasVideo = videoAvailability[movie.movie_id];
    const existing = getDownloadForMovie(movie.movie_id);

    if (isFetching) {
      return <ActivityIndicator size="small" color="white" />;
    }

    if (existing?.status === downloadStates.COMPLETED) {
      return <Ionicons name="checkmark-circle" size={22} color="#4ade80" />;
    }

    if (
      existing?.status === downloadStates.DOWNLOADING ||
      existing?.status === downloadStates.QUEUED
    ) {
      return <ActivityIndicator size="small" color="#60a5fa" />;
    }

    if (existing?.status === downloadStates.FAILED) {
      return <Ionicons name="refresh" size={20} color="#f87171" />;
    }

    // Not checked yet, or checked and unavailable — show dimmed icon
    const dimmed = hasVideo === false || hasVideo === undefined;
    return (
      <Ionicons
        name="download-outline"
        size={20}
        color={dimmed ? "rgba(255,255,255,0.18)" : "white"}
      />
    );
  };

  const renderMovie = ({ item }) => {
    const hasVideo = videoAvailability[item.movie_id];
    const downloadDisabled = hasVideo === false || hasVideo === undefined;

    return (
      <Pressable
        onPress={() => handleMoviePress(item)}
        className="flex-row items-center bg-white/10 rounded-2xl p-3 mb-3"
      >
        <Image
          source={{ uri: item.poster_url }}
          className="w-16 h-24 rounded-lg"
          resizeMode="cover"
        />
        <View className="flex-1 ml-4">
          <Text className="text-white text-lg font-bold">{item.title}</Text>
          <Text className="text-white/70 text-sm">
            👁️ {item.watch_count} views • ⭐ {item.avg_rating || 0}
          </Text>
          <View className="flex-row items-center mt-1">
            <View className="bg-purple-500/20 px-2 py-0.5 rounded-full">
              <Text className="text-purple-300 text-xs">Trending</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            handleDownloadPress(item);
          }}
          disabled={downloadDisabled}
          hitSlop={10}
          className="p-3 rounded-full mr-2"
          style={{
            width: 42,
            height: 42,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: downloadDisabled
              ? "rgba(255,255,255,0.03)"
              : "rgba(255,255,255,0.12)",
            opacity: downloadDisabled ? 0.45 : 1,
          }}
        >
          {renderDownloadIcon(item)}
        </Pressable>

        <View className="bg-blue-500/20 p-2 rounded-full">
          <Ionicons name="play-circle" size={24} color="#60a5fa" />
        </View>
      </Pressable>
    );
  };

  return (
    <ImageBackground
      source={require("../../assets/Images/TrendingPage.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          "rgba(24,26,59,0.5)",
          "rgba(79,70,229,0.5)",
          "rgba(96,165,250,0.5)",
        ]}
        className="flex-1"
      >
        {loading ? (
          <SafeAreaView className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="white" />
            <Text className="text-white/70 mt-4">
              Loading trending movies...
            </Text>
          </SafeAreaView>
        ) : permissionDenied ? (
          <SafeAreaView className="flex-1 items-center justify-center px-6">
            <Ionicons name="location-outline" size={60} color="white/30" />
            <Text className="text-white text-xl font-bold mt-4 text-center">
              Location Access Needed
            </Text>
            <Text className="text-white/50 text-center mt-2">
              Please enable location to see trending movies near you
            </Text>
            <Pressable
              onPress={refresh}
              className="mt-6 bg-white/20 px-6 py-3 rounded-full"
            >
              <Text className="text-white font-bold">Try Again</Text>
            </Pressable>
          </SafeAreaView>
        ) : (
          <SafeAreaView className="flex-1">
            <View className="flex-1 px-4 pt-2">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-white/70 text-sm">Trending in</Text>
                  <Text className="text-white text-2xl font-bold">
                    {city || "Nearby"}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => router.push("/downloads")}
                    className="bg-white/10 p-3 rounded-full"
                  >
                    <Ionicons name="download-outline" size={20} color="white" />
                  </Pressable>
                  <Pressable
                    onPress={refresh}
                    className="bg-white/10 p-3 rounded-full"
                  >
                    <Ionicons name="refresh" size={20} color="white" />
                  </Pressable>
                </View>
              </View>

              {/* Movies List */}
              <FlatList
                data={movies}
                renderItem={renderMovie}
                keyExtractor={(item) => item.movie_id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={
                  <RefreshControl
                    refreshing={loading}
                    onRefresh={refresh}
                    tintColor="#FFFFFF"
                  />
                }
                ListEmptyComponent={
                  <View className="items-center justify-center py-20">
                    <Ionicons name="film-outline" size={60} color="white/30" />
                    <Text className="text-white/50 text-center mt-4">
                      No trending movies found nearby
                    </Text>
                    <Pressable
                      onPress={refresh}
                      className="mt-4 bg-white/10 px-6 py-2 rounded-full"
                    >
                      <Text className="text-white">Refresh</Text>
                    </Pressable>
                  </View>
                }
              />
            </View>
          </SafeAreaView>
        )}
      </LinearGradient>
    </ImageBackground>
  );
}
