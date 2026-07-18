import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

const ClipComments = ({ clipId, onClose }) => {
  const [draft, setDraft] = useState("");

  if (!clipId) return null;

  return (
    <Modal
      transparent
      animationType="slide"
      visible={Boolean(clipId)}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.7)",
          justifyContent: "flex-end",
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: "#111827",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            minHeight: 240,
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
            <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>
              Comments
            </Text>
            <Pressable onPress={onClose} style={{ padding: 6 }}>
              <Ionicons name="close" size={20} color="white" />
            </Pressable>
          </View>

          <Text style={{ color: "#94a3b8", marginBottom: 16 }}>
            Comments for this clip will appear here soon.
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Add a comment…"
              placeholderTextColor="#64748b"
              style={{
                flex: 1,
                backgroundColor: "#1f2937",
                color: "white",
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            />
            <Pressable
              onPress={() => {
                if (!draft.trim()) return;
                setDraft("");
              }}
              style={{
                marginLeft: 8,
                backgroundColor: "#4f46e5",
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>Post</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ClipComments;
