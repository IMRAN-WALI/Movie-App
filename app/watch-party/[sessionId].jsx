import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Share,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRealtimeParty } from "../../src/hooks/useRealtimeParty";
import { supabase } from "../../src/lib/supabase";
import { leaveWatchParty } from "../../src/services/partyService";

const WatchPartyRoom = () => {
  const { sessionId } = useLocalSearchParams();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [inviteCode, setInviteCode] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const scrollViewRef = useRef();
  const inputRef = useRef();

  const { party, messages, participants, loading, sendMessage } =
    useRealtimeParty(sessionId ?? null);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (party?.movie_id) {
      supabase
        .from("movies")
        .select("title")
        .eq("id", party.movie_id)
        .single()
        .then(({ data }) => {
          if (data?.title) setMovieTitle(data.title);
        })
        .catch(() => {});
    }
  }, [party?.movie_id]);

  useEffect(() => {
    if (party?.invite_code) {
      setInviteCode(party.invite_code);
    }
  }, [party]);

  useEffect(() => {
    if (messages?.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleLeave = async () => {
    if (sessionId) await leaveWatchParty(sessionId);
    router.back();
  };

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `🎬 Join my Watch Party!\n\n📽️ Movie: ${movieTitle || `Movie #${party?.movie_id}`}\n🎫 Invite Code: ${inviteCode}\n\nDownload the app to join!`,
        title: "Watch Party Invite",
      });
    } catch (error) {
      await Share.share({
        message: `🎬 Join my Watch Party!\n\nMovie ID: ${party?.movie_id}\nInvite Code: ${inviteCode}\n\nDownload the app to join!`,
        title: "Watch Party Invite",
      });
    }
  };

  const copyInviteCode = () => {
    Alert.alert("Copied!", `Invite code: ${inviteCode}`);
  };

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput.trim());
      setMessageInput("");
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#0f172a",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="white" size="large" />
        <Text style={{ color: "white", marginTop: 16 }}>Loading party...</Text>
      </SafeAreaView>
    );
  }

  if (!party) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#0f172a",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "white", fontSize: 18 }}>❌ Party not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: "#60a5fa" }}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              backgroundColor: "#0f172a",
              borderBottomWidth: 1,
              borderBottomColor: "#1e293b",
            }}
          >
            <Pressable onPress={handleLeave}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <Pressable
              onPress={copyInviteCode}
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Text
                style={{
                  color: "#60a5fa",
                  fontWeight: "bold",
                  fontSize: 16,
                  letterSpacing: 2,
                }}
              >
                {inviteCode}
              </Text>
              <Ionicons name="copy-outline" size={18} color="#60a5fa" />
            </Pressable>
            <Pressable onPress={handleShareInvite}>
              <Ionicons name="share-outline" size={24} color="white" />
            </Pressable>
          </View>

          {/* Movie Info */}
          <View
            style={{
              padding: 14,
              backgroundColor: "#1e293b",
              marginHorizontal: 16,
              marginVertical: 10,
              borderRadius: 12,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
              >
                🎬 {movieTitle || `Movie #${party?.movie_id}`}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 2,
                }}
              >
                <Ionicons name="people" size={14} color="#94a3b8" />
                <Text style={{ color: "#94a3b8", marginLeft: 4, fontSize: 13 }}>
                  {participants?.length || 0} joined
                </Text>
              </View>
            </View>
            <View
              style={{
                backgroundColor: "#334155",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  color: "#94a3b8",
                  fontSize: 11,
                  textTransform: "uppercase",
                }}
              >
                {party.status}
              </Text>
            </View>
          </View>

          {/* Chat Messages */}
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 10 }}
              showsVerticalScrollIndicator={false}
            >
              {messages?.length === 0 ? (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingTop: 40,
                  }}
                >
                  <Ionicons
                    name="chatbubbles-outline"
                    size={50}
                    color="#334155"
                  />
                  <Text
                    style={{ color: "#64748b", marginTop: 12, fontSize: 16 }}
                  >
                    No messages yet
                  </Text>
                  <Text
                    style={{ color: "#475569", marginTop: 4, fontSize: 13 }}
                  >
                    Start the conversation! 💬
                  </Text>
                </View>
              ) : (
                messages?.map((msg, index) => {
                  const isOwn = msg.user_id === currentUserId;
                  return (
                    <View
                      key={index}
                      style={{
                        backgroundColor: isOwn ? "#3b82f6" : "#1e293b",
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 12,
                        marginBottom: 8,
                        alignSelf: isOwn ? "flex-end" : "flex-start",
                        maxWidth: "80%",
                        borderBottomRightRadius: isOwn ? 4 : 12,
                        borderBottomLeftRadius: isOwn ? 12 : 4,
                      }}
                    >
                      <Text
                        style={{ color: "white", fontSize: 15, lineHeight: 22 }}
                      >
                        {msg.content}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>

          {/* ✅ Message Input - PERFECT CENTER ALIGNMENT */}
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 12,
              paddingVertical: 10,
              gap: 8,
              backgroundColor: "#0f172a",
              borderTopWidth: 1,
              borderTopColor: "#1e293b",
              alignItems: "center",
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "#1e293b",
                borderRadius: 20,
                paddingHorizontal: 16,
                justifyContent: "center",
              }}
            >
              <TextInput
                ref={inputRef}
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  paddingVertical: 10,
                  paddingHorizontal: 0,
                  minHeight: 44,
                }}
                placeholder="Type a message..."
                placeholderTextColor="#94a3b8"
                value={messageInput}
                onChangeText={setMessageInput}
                multiline={false}
                returnKeyType="send"
                onSubmitEditing={handleSendMessage}
                selectionColor="#3b82f6"
                cursorColor="#3b82f6"
              />
            </View>
            <Pressable
              onPress={handleSendMessage}
              style={({ pressed }) => ({
                backgroundColor: messageInput.trim() ? "#3b82f6" : "#334155",
                width: 55,
                height: 55,
                borderRadius: 25,
                justifyContent: "center",
                alignItems: "center",
                opacity: pressed ? 0.8 : 1,
              })}
              disabled={!messageInput.trim()}
            >
              <Ionicons
                name="send"
                size={30}
                color={messageInput.trim() ? "white" : "#64748b"}
              />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default WatchPartyRoom;
