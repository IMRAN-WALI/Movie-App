import React, { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

type WatchPartyMessage = {
  id: string;
  party_id: string;
  user_id: string;
  body: string;
  created_at?: string;
};

interface Props {
  messages: WatchPartyMessage[];
  currentUserId: string;
  onSend: (body: string) => Promise<void>;
  nameForUserId: (userId: string) => string;
}

const PartyChat = ({
  messages,
  currentUserId,
  onSend,
  nameForUserId,
}: Props) => {
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList<WatchPartyMessage>>(null);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    await onSend(body);
    requestAnimationFrame(() =>
      listRef.current?.scrollToEnd({ animated: true }),
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: false })
        }
        contentContainerStyle={{ padding: 12, gap: 8 }}
        renderItem={({ item }) => {
          const mine = item.user_id === currentUserId;
          return (
            <View
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "80%",
                backgroundColor: mine ? "#4f46e5" : "#1e293b",
                borderRadius: 14,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              {!mine && (
                <Text
                  style={{ color: "#94a3b8", fontSize: 11, marginBottom: 2 }}
                >
                  {nameForUserId(item.user_id)}
                </Text>
              )}
              <Text style={{ color: "white" }}>{item.body}</Text>
            </View>
          );
        }}
      />
      <View
        style={{
          flexDirection: "row",
          padding: 8,
          gap: 8,
          borderTopWidth: 1,
          borderTopColor: "#1e293b",
        }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Say something…"
          placeholderTextColor="#64748b"
          style={{
            flex: 1,
            backgroundColor: "#1e293b",
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 10,
            color: "white",
          }}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <Pressable
          onPress={handleSend}
          style={{
            backgroundColor: "#4f46e5",
            borderRadius: 20,
            paddingHorizontal: 16,
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

export default PartyChat;
