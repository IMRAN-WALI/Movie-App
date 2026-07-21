import React from "react";
import { Image, Text, View, Pressable } from "react-native";
import { router } from "expo-router";

const CARD_COLOR = "#1E293B";
const PRIMARY = "#818CF8";
const SECONDARY = "#94A3B8";

function MovieCard({ item, index }) {
  const rating =
    item.avg_rating !== null && item.avg_rating !== undefined
      ? Number(item.avg_rating).toFixed(1)
      : null;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/movies/[id]",
          params: { id: item.movie_id },
        })
      }
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: CARD_COLOR,
        borderRadius: 14,
        padding: 12,
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          width: 30,
          textAlign: "center",
          color: PRIMARY,
          fontSize: 20,
          fontWeight: "bold",
        }}
      >
        #{index + 1}
      </Text>

      {item.poster_url ? (
        <Image
          source={{ uri: item.poster_url }}
          style={{
            width: 60,
            height: 90,
            borderRadius: 10,
            marginHorizontal: 12,
            backgroundColor: "#334155",
          }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: 60,
            height: 90,
            borderRadius: 10,
            marginHorizontal: 12,
            backgroundColor: "#334155",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#CBD5E1" }}>No Image</Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={2}
          style={{
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: "700",
          }}
        >
          {item.title}
        </Text>

        <Text
          style={{
            color: SECONDARY,
            marginTop: 8,
            fontSize: 13,
          }}
        >
          👥 {item.watch_count} nearby watches
        </Text>

        {rating && (
          <Text
            style={{
              color: "#FACC15",
              marginTop: 4,
              fontWeight: "600",
            }}
          >
            ⭐ {rating}/10
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export default function TrendingList({ movies }) {
  if (!movies || movies.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 30,
        }}
      >
        <Text
          style={{
            color: "#94A3B8",
            fontSize: 16,
            textAlign: "center",
          }}
        >
          No trending movies found nearby.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        padding: 16,
      }}
    >
      {movies.map((item, index) => (
        <MovieCard key={item.movie_id} item={item} index={index} />
      ))}
    </View>
  );
}
