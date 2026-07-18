import React from "react";
import { FlatList, Image, Text, View } from "react-native";

const TrendingList = ({ movies }) => {
  return (
    <FlatList
      data={movies}
      keyExtractor={(item) => item.movie_id}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      renderItem={({ item, index }) => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#1e293b",
            borderRadius: 14,
            padding: 10,
            gap: 12,
          }}
        >
          <Text
            style={{
              color: "#818cf8",
              fontWeight: "800",
              fontSize: 18,
              width: 24,
            }}
          >
            {index + 1}
          </Text>
          {item.poster_url ? (
            <Image
              source={{ uri: item.poster_url }}
              style={{
                width: 48,
                height: 72,
                borderRadius: 8,
                backgroundColor: "#334155",
              }}
            />
          ) : (
            <View
              style={{
                width: 48,
                height: 72,
                borderRadius: 8,
                backgroundColor: "#334155",
              }}
            />
          )}
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: "white", fontWeight: "600", fontSize: 15 }}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
              {item.watch_count} watches nearby
              {item.avg_rating ? ` · ★ ${item.avg_rating.toFixed(1)}` : ""}
            </Text>
          </View>
        </View>
      )}
    />
  );
};

export default TrendingList;
