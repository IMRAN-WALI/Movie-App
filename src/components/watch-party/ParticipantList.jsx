import React from "react";
import { FlatList, Image, Text, View } from "react-native";
import SpeakingIndicator from "./SpeakingIndicator";

const ParticipantList = ({ participants, speakingIdentities }) => {
  return (
    <FlatList
      horizontal
      data={participants}
      keyExtractor={(item) => item.userId}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 12, gap: 12 }}
      renderItem={({ item }) => {
        const speaking = speakingIdentities.has(item.userId);
        return (
          <View style={{ alignItems: "center", width: 64 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                borderWidth: speaking ? 3 : 0,
                borderColor: "#4ade80",
                overflow: "hidden",
                backgroundColor: "#3730a3",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {item.avatarUrl ? (
                <Image
                  source={{ uri: item.avatarUrl }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <Text style={{ color: "white", fontWeight: "600" }}>
                  {item.displayName.slice(0, 1).toUpperCase()}
                </Text>
              )}
              <SpeakingIndicator active={speaking} />
            </View>
            <Text
              numberOfLines={1}
              style={{
                color: "white",
                fontSize: 12,
                marginTop: 4,
                maxWidth: 64,
              }}
            >
              {item.displayName}
            </Text>
            {item.isMuted && (
              <Text style={{ color: "#94a3b8", fontSize: 10 }}>muted</Text>
            )}
          </View>
        );
      }}
    />
  );
};

export default ParticipantList;
