import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLanguage } from "../../i18n/LanguageContext";
import { fetchComments, postComment } from "../../services/clipService";

function timeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

const ClipComments = ({ clipId, onClose, onCommentPosted }) => {
  const { t } = useLanguage();
  const [draft, setDraft] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!clipId) {
      setComments([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchComments(clipId)
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .catch((e) => {
        console.error("fetchComments error:", e);
        if (!cancelled) {
          setError(t("clips_load_comments_error"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clipId, t]);

  const handlePost = async () => {
    const body = draft.trim();
    if (!body || !clipId || posting) return;

    setPosting(true);
    try {
      const newComment = await postComment(clipId, body);
      setComments((prev) => [...prev, newComment]);
      setDraft("");
      onCommentPosted?.(clipId);
    } catch (e) {
      console.error("postComment error:", e);
      setError(t("clips_post_comment_error"));
    } finally {
      setPosting(false);
    }
  };

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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={{
              backgroundColor: "#111827",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              minHeight: 320,
              maxHeight: "75%",
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
                {t("clips_comments_title")}
              </Text>
              <Pressable onPress={onClose} hitSlop={10} style={{ padding: 6 }}>
                <Ionicons name="close" size={20} color="white" />
              </Pressable>
            </View>

            {loading && (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <ActivityIndicator color="white" />
              </View>
            )}

            {!loading && error && comments.length === 0 && (
              <Text style={{ color: "#f87171", marginBottom: 12 }}>
                {error}
              </Text>
            )}

            {!loading && !error && comments.length === 0 && (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <Ionicons name="chatbubble-outline" size={30} color="#334155" />
                <Text style={{ color: "#94a3b8", marginTop: 8 }}>
                  {t("clips_no_comments_yet")}
                </Text>
                <Text style={{ color: "#475569", fontSize: 12, marginTop: 2 }}>
                  {t("clips_be_first")}
                </Text>
              </View>
            )}

            {!loading && comments.length > 0 && (
              <FlatList
                data={comments}
                keyExtractor={(item) => String(item.id)}
                style={{ flexGrow: 0 }}
                contentContainerStyle={{ paddingBottom: 8, gap: 14 }}
                renderItem={({ item }) => (
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: "#3730a3",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: "white", fontWeight: "700" }}>
                        {(item.profile?.display_name || "?")
                          .slice(0, 1)
                          .toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontWeight: "700",
                            fontSize: 13,
                          }}
                        >
                          {item.profile?.display_name || "User"}
                        </Text>
                        {item.created_at && (
                          <Text style={{ color: "#64748b", fontSize: 11 }}>
                            {timeAgo(item.created_at)}
                          </Text>
                        )}
                      </View>
                      <Text
                        style={{ color: "#cbd5e1", fontSize: 14, marginTop: 2 }}
                      >
                        {item.body}
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 16,
              }}
            >
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={t("clips_comment_placeholder")}
                placeholderTextColor="#64748b"
                style={{
                  flex: 1,
                  backgroundColor: "#1f2937",
                  color: "white",
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
                editable={!posting}
                onSubmitEditing={handlePost}
                returnKeyType="send"
              />
              <Pressable
                onPress={handlePost}
                disabled={!draft.trim() || posting}
                style={{
                  marginLeft: 8,
                  backgroundColor: draft.trim() ? "#4f46e5" : "#374151",
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  minWidth: 60,
                  alignItems: "center",
                }}
              >
                {posting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={{ color: "white", fontWeight: "600" }}>
                    {t("clips_post_comment")}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default ClipComments;
