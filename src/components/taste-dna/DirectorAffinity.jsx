import React from "react";
import { Text, View } from "react-native";

const DirectorAffinity = ({ directors }) => {
  const sorted = Object.entries(directors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (sorted.length === 0) {
    return (
      <Text style={{ color: "#94a3b8" }}>
        Watch and rate a few more movies to reveal director affinities.
      </Text>
    );
  }

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {sorted.map(([name, pct]) => (
        <View
          key={name}
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 20,
            paddingVertical: 8,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>{name}</Text>
          <Text style={{ color: "#a5b4fc" }}>{Math.round(pct * 100)}%</Text>
        </View>
      ))}
    </View>
  );
};

export default DirectorAffinity;
