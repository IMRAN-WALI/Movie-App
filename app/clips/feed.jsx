import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import ClipCard from "../../src/components/clips/ClipCard.jsx";
import ClipComments from "../../src/components/clips/ClipComments.jsx";
import { useLanguage } from "../../src/i18n/LanguageContext";
import { supabase } from "../../src/lib/supabase";
import {
  fetchClipFeed,
  fetchLikedClipIds,
} from "../../src/services/clipService.js";

// Alternative examples (use whichever matches your folder):
const THEATER_BG = require("../../assets/Images/Feed.png");
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const GRID_COLUMNS = 3;
const GRID_GAP = 2;
const GRID_ITEM_WIDTH =
  (SCREEN_WIDTH - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
const GRID_ITEM_HEIGHT = GRID_ITEM_WIDTH * 1.55;

const ITEM_HEIGHT = SCREEN_HEIGHT - 20;

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

const GridThumb = ({ clip, onPress }) => {
  const player = useVideoPlayer(clip.video_url ?? "", (p) => {
    p.loop = false;
    p.muted = true;
  });

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: GRID_ITEM_WIDTH,
        height: GRID_ITEM_HEIGHT,
        marginRight: GRID_GAP,
        marginBottom: GRID_GAP,
        backgroundColor: "#111827",
        overflow: "hidden",
        borderRadius: 6,
      }}
    >
      <VideoView
        player={player}
        style={{ width: "100%", height: "100%" }}
        nativeControls={false}
        contentFit="cover"
        pointerEvents="none"
      />

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 36,
          backgroundColor: "rgba(0,0,0,0.45)",
        }}
      />

      <View
        style={{
          position: "absolute",
          bottom: 6,
          left: 6,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Ionicons name="eye" size={13} color="white" />
        <Text
          style={{
            color: "white",
            fontSize: 12,
            fontWeight: "700",
            textShadowColor: "rgba(0,0,0,0.9)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
          }}
        >
          {formatCount(clip.like_count)}
        </Text>
      </View>

      <View style={{ position: "absolute", top: 6, right: 6 }}>
        <Ionicons name="play" size={14} color="rgba(255,255,255,0.9)" />
      </View>
    </Pressable>
  );
};

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

  const [viewMode, setViewMode] = useState("grid");
  const [startIndex, setStartIndex] = useState(0);
  const feedListRef = useRef(null);

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

  const openClipAt = useCallback((index) => {
    setStartIndex(index);
    setViewMode("player");
  }, []);

  const backToGrid = useCallback(() => {
    setViewMode("grid");
  }, []);

  const feedGetItemLayout = useMemo(
    () => (data, index) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  // ---------------------------------------------------------------
  // Background Component
  // ---------------------------------------------------------------
  const TheaterBackground = ({ children }) => (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={THEATER_BG}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        {/* dark purple overlay */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(8, 4, 18, 0)" },
          ]}
        />
      </ImageBackground>

      {/* soft blur on top */}
      <BlurView
        intensity={22}
        tint="dark"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {children}
    </View>
  );

  // ---------------------------------------------------------------
  // GRID VIEW
  // ---------------------------------------------------------------
  if (viewMode === "grid") {
    return (
      <TheaterBackground>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 22,
                fontWeight: "800",
                letterSpacing: 0.4,
                textShadowColor: "rgba(139, 92, 246, 0.7)",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
              }}
            >
              {t("home_clips") || "Clips"}
            </Text>

            <Pressable
              onPress={() => router.push("/clips/create")}
              style={{
                backgroundColor: "rgba(255,255,255,0.12)",
                borderRadius: 20,
                padding: 9,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.18)",
              }}
            >
              <Ionicons name="add" size={22} color="white" />
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
              <ActivityIndicator color="#c4b5fd" size="large" />
            </View>
          ) : (
            <FlatList
              data={clips}
              keyExtractor={(item) => item.id}
              numColumns={GRID_COLUMNS}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 40,
                paddingHorizontal: 1,
              }}
              onEndReachedThreshold={2}
              onEndReached={handleEndReached}
              renderItem={({ item, index }) => (
                <GridThumb clip={item} onPress={() => openClipAt(index)} />
              )}
              ListFooterComponent={
                loadingMore ? (
                  <View style={{ padding: 25, alignItems: "center" }}>
                    <ActivityIndicator color="#c4b5fd" size="large" />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View
                  style={{
                    height: SCREEN_HEIGHT * 0.7,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 40,
                  }}
                >
                  <Ionicons name="film-outline" size={52} color="#a78bfa" />
                  <Text
                    style={{
                      color: "#c4b5fd",
                      marginTop: 16,
                      fontSize: 16,
                      textAlign: "center",
                      opacity: 0.9,
                    }}
                  >
                    {t("clips_empty") || "No clips available"}
                  </Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </TheaterBackground>
    );
  }

  // ---------------------------------------------------------------
  // FULL-SCREEN PLAYER
  // ---------------------------------------------------------------
  return (
    <TheaterBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View
          style={{
            position: "absolute",
            top: 40,
            left: 16,
            zIndex: 20,
          }}
        >
          <Pressable
            onPress={backToGrid}
            style={{
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: 22,
              padding: 11,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.15)",
            }}
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </Pressable>
        </View>

        <View
          style={{
            position: "absolute",
            top: 40,
            right: 16,
            zIndex: 20,
          }}
        >
          <Pressable
            onPress={() => router.push("/clips/create")}
            style={{
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: 22,
              padding: 11,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.15)",
            }}
          >
            <Ionicons name="add" size={24} color="white" />
          </Pressable>
        </View>

        <FlatList
          ref={feedListRef}
          data={clips}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          onEndReachedThreshold={2}
          onEndReached={handleEndReached}
          initialScrollIndex={startIndex}
          getItemLayout={feedGetItemLayout}
          onScrollToIndexFailed={({ index }) => {
            setTimeout(() => {
              feedListRef.current?.scrollToIndex({
                index,
                animated: false,
              });
            }, 150);
          }}
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
                <ActivityIndicator color="#c4b5fd" size="large" />
              </View>
            ) : null
          }
        />

        <ClipComments
          clipId={activeCommentsClipId}
          onClose={() => setActiveCommentsClipId(null)}
          onCommentPosted={handleCommentPosted}
        />
      </SafeAreaView>
    </TheaterBackground>
  );
};

export default ClipsFeed;
