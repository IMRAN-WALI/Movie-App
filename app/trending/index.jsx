import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
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

export default function TrendingScreen() {
  const { movies, city, loading, error, permissionDenied, refresh } =
    useTrendingNearby();

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

  const renderMovie = ({ item }) => (
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
      <View className="bg-blue-500/20 p-2 rounded-full">
        <Ionicons name="play-circle" size={24} color="#60a5fa" />
      </View>
    </Pressable>
  );

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
                <Pressable
                  onPress={refresh}
                  className="bg-white/10 p-3 rounded-full"
                >
                  <Ionicons name="refresh" size={20} color="white" />
                </Pressable>
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
