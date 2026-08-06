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
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }} edges={["top"]}>
      <View
        style={{
          position: "absolute",
          top: 50,
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
          }}
        >
          <Ionicons name="add" size={22} color="white" />
        </Pressable>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color="white" />
        </View>
      ) : (
        <FlatList
          data={clips}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={SCREEN_HEIGHT}
          decelerationRate="fast"
          onEndReachedThreshold={2}
          onEndReached={handleEndReached}
          renderItem={({ item }) => (
            <View style={{ height: SCREEN_HEIGHT }}>
              <ClipCard
                clip={item}
                onOpenComments={setActiveCommentsClipId}
                currentUserId={currentUserId}
                onDeleted={handleClipDeleted}
              />
            </View>
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator color="white" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View
              style={{
                height: SCREEN_HEIGHT,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 40,
              }}
            >
              <Ionicons name="film-outline" size={40} color="#334155" />
              <Text
                style={{ color: "#94a3b8", marginTop: 12, textAlign: "center" }}
              >
                {t("clips_empty")}
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
  );
};

export default ClipsFeed;
