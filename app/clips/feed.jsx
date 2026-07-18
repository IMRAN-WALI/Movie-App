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
import { fetchClipFeed } from "../../src/services/clipService.js";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const ClipsFeed = () => {
  const [clips, setClips] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeCommentsClipId, setActiveCommentsClipId] = useState(null);
  const loadedPages = useRef(new Set());

  const loadPage = useCallback(async (nextPage) => {
    if (loadedPages.current.has(nextPage)) return;
    loadedPages.current.add(nextPage);

    if (nextPage === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const results = await fetchClipFeed(nextPage);
      setClips((prev) => (nextPage === 0 ? results : [...prev, ...results]));
      setHasMore(results.length > 0);
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
              <ClipCard clip={item} onOpenComments={setActiveCommentsClipId} />
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
              }}
            >
              <Text style={{ color: "#94a3b8" }}>
                No clips yet — be the first to post one.
              </Text>
            </View>
          }
        />
      )}

      <ClipComments
        clipId={activeCommentsClipId}
        onClose={() => setActiveCommentsClipId(null)}
      />
    </SafeAreaView>
  );
};

export default ClipsFeed;
