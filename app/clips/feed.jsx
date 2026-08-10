import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ClipCard from "../../src/components/clips/ClipCard.jsx";
import ClipComments from "../../src/components/clips/ClipComments.jsx";
import { useLanguage } from "../../src/i18n/LanguageContext";
import { supabase } from "../../src/lib/supabase";
import {
  fetchClipFeed,
  fetchLikedClipIds,
} from "../../src/services/clipService.js";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Instagram style gap for next video preview
const ITEM_HEIGHT = SCREEN_HEIGHT - 20;

const ClipsFeed = () => {
  const { t } = useLanguage();
  const [clips, setClips] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeCommentsClipId, setActiveCommentsClipId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const loadedPages = useRef(new Set());

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  const loadPage = useCallback(async (nextPage) => {
    if (loadedPages.current.has(nextPage)) return;
    loadedPages.current.add(nextPage);

    if (nextPage === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const results = await fetchClipFeed(nextPage);
      const likedIds = await fetchLikedClipIds(results.map((r) => r.id));
      const likedSet = new Set(likedIds);
      const withLiked = results.map((r) => ({
        ...r,
        liked: likedSet.has(r.id),
      }));

      setClips((prev) =>
        nextPage === 0 ? withLiked : [...prev, ...withLiked],
      );
      setHasMore(results.length > 0);
    } catch (e) {
      console.error("loadPage error:", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPage(0);
  }, [loadPage]);

  const handleEndReached = () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadPage(nextPage);
  };

  const handleCommentPosted = useCallback((clipId) => {
    setClips((prev) =>
      prev.map((c) =>
        c.id === clipId
          ? { ...c, comment_count: (c.comment_count ?? 0) + 1 }
          : c,
      ),
    );
  }, []);

  const handleClipDeleted = useCallback((clipId) => {
    setClips((prev) => prev.filter((c) => c.id !== clipId));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Add Button (+ icon) */}
        <View
          style={{
            position: "absolute",
            top: 40,
            right: 16,
            zIndex: 10,
          }}
        >
          <Pressable
            onPress={() => router.push("/clips/create")}
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 20,
              padding: 10,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
            }}
          >
            <Ionicons name="add" size={24} color="white" />
          </Pressable>
        </View>

        {loading ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator color="white" size="large" />
          </View>
        ) : (
          <FlatList
            data={clips}
            keyExtractor={(item) => item.id}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            // 💡 Magic: Next video ka top edge dikhane ke liye
            snapToInterval={ITEM_HEIGHT}
            snapToAlignment="start"
            decelerationRate="fast"
            onEndReachedThreshold={2}
            onEndReached={handleEndReached}
            renderItem={({ item }) => (
              <View
                style={{
                  height: ITEM_HEIGHT,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <View style={{ width: "100%", height: "100%" }}>
                  <ClipCard
                    clip={item}
                    onOpenComments={setActiveCommentsClipId}
                    currentUserId={currentUserId}
                    onDeleted={handleClipDeleted}
                  />
                </View>
              </View>
            )}
            ListFooterComponent={
              loadingMore ? (
                <View style={{ padding: 25, alignItems: "center" }}>
                  <ActivityIndicator color="white" size="large" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View
                style={{
                  height: SCREEN_HEIGHT * 0.8,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 40,
                }}
              >
                <Ionicons name="film-outline" size={50} color="#64748b" />
                <Text
                  style={{
                    color: "#94a3b8",
                    marginTop: 16,
                    fontSize: 16,
                    textAlign: "center",
                  }}
                >
                  {t("clips_empty") || "No clips available"}
                </Text>
              </View>
            }
          />
        )}

        <ClipComments
          clipId={activeCommentsClipId}
          onClose={() => setActiveCommentsClipId(null)}
          onCommentPosted={handleCommentPosted}
        />
      </SafeAreaView>
    </View>
  );
};

export default ClipsFeed;
