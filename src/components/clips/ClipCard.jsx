import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

const ClipCard = ({ clip, onOpenComments }) => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#09090b",
        padding: 16,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          backgroundColor: "#111827",
          borderRadius: 24,
          padding: 18,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
            {clip?.title || "Fresh clip"}
          </Text>
          <Pressable
            onPress={() => onOpenComments?.(clip?.id)}
            style={{ padding: 6 }}
          >
            <Ionicons name="chatbubble-outline" size={20} color="white" />
          </Pressable>
        </View>

        <Text style={{ color: "#94a3b8", fontSize: 14, lineHeight: 20 }}>
          {clip?.description || "A polished clip card is ready to use."}
        </Text>
      </View>
    </View>
  );
};

export default ClipCard;
