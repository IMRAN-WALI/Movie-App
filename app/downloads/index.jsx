import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  downloadManager,
  downloadStates,
} from "../../src/services/downloadService";

// =====================================================
// DOWNLOAD CARD
// =====================================================

function DownloadCard({
  item,
  onPlay,
  onDelete,
  selectMode,
  selectForClip,
  onSelectForParty,
}) {
  const completed = item.status === downloadStates.COMPLETED;
  const downloading = item.status === downloadStates.DOWNLOADING;
  const queued = item.status === downloadStates.QUEUED;
  const failed = item.status === downloadStates.FAILED;
  const paused = item.status === downloadStates.PAUSED;

  const progress = Math.round(
    Math.max(0, Math.min(1, Number(item.progress) || 0)) * 100,
  );

  const handlePress = () => {
    if (!completed) return;
    if (selectMode) {
      onSelectForParty(item);
    } else {
      onPlay(item);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: selectMode && completed ? 1 : 0,
        borderColor: "rgba(129,140,248,0.5)",
      }}
    >
      {item.posterUrl ? (
        <Image
          source={{ uri: item.posterUrl }}
          style={{ width: 64, height: 88, borderRadius: 8 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: 64,
            height: 88,
            borderRadius: 8,
            backgroundColor: "rgba(255,255,255,0.1)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="film-outline" size={26} color="#64748b" />
        </View>
      )}

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text
          style={{ color: "white", fontWeight: "800", fontSize: 15 }}
          numberOfLines={1}
        >
          {item.title}
        </Text>

        {completed && (
          <Text
            style={{
              color: "#4ade80",
              fontSize: 12,
              marginTop: 5,
              fontWeight: "700",
            }}
          >
            ✓ Downloaded
          </Text>
        )}

        {downloading && (
          <Text
            style={{
              color: "#facc15",
              fontSize: 12,
              marginTop: 5,
              fontWeight: "700",
            }}
          >
            Downloading {progress}%
          </Text>
        )}

        {queued && (
          <Text
            style={{
              color: "#facc15",
              fontSize: 12,
              marginTop: 5,
              fontWeight: "700",
            }}
          >
            Preparing download...
          </Text>
        )}

        {paused && (
          <Text
            style={{
              color: "#f59e0b",
              fontSize: 12,
              marginTop: 5,
              fontWeight: "700",
            }}
          >
            Paused
          </Text>
        )}

        {failed && (
          <Text
            style={{
              color: "#f87171",
              fontSize: 12,
              marginTop: 5,
              fontWeight: "700",
            }}
          >
            Download failed
          </Text>
        )}

        {(downloading || queued || paused || completed) && (
          <View
            style={{
              height: 5,
              borderRadius: 3,
              backgroundColor: "rgba(255,255,255,0.12)",
              marginTop: 8,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: completed ? "100%" : `${progress}%`,
                backgroundColor: completed ? "#4ade80" : "#4f46e5",
                borderRadius: 3,
              }}
            />
          </View>
        )}

        {completed && !selectMode && (
          <Text style={{ color: "#94a3b8", fontSize: 10, marginTop: 4 }}>
            100% • Available offline
          </Text>
        )}

        {completed && selectMode && (
          <Text
            style={{
              color: "#a5b4fc",
              fontSize: 11,
              marginTop: 4,
              fontWeight: "700",
            }}
          >
            {selectForClip
              ? "Tap to make a clip from this movie"
              : "Tap to host a party with this movie"}
          </Text>
        )}
      </View>

      {completed && !selectMode && (
        <Pressable
          onPress={() => onPlay(item)}
          hitSlop={10}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "#4f46e5",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 8,
          }}
        >
          <Ionicons name="play" size={20} color="white" />
        </Pressable>
      )}

      {completed && selectMode && (
        <Pressable
          onPress={() => onSelectForParty(item)}
          hitSlop={10}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "#4f46e5",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 8,
          }}
        >
          <Ionicons
            name={selectForClip ? "cut-outline" : "people"}
            size={20}
            color="white"
          />
        </Pressable>
      )}

      <Pressable
        onPress={() => onDelete(item.id)}
        hitSlop={10}
        style={{ padding: 8 }}
      >
        <Ionicons name="trash-outline" size={20} color="#f87171" />
      </Pressable>
    </Pressable>
  );
}

// =====================================================
// PAGE
// =====================================================

export default function DownloadsPage() {
  const { selectFor } = useLocalSearchParams();
  const selectMode = selectFor === "party" || selectFor === "clip";
  const selectForClip = selectFor === "clip";

  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDownloads = useCallback(async () => {
    try {
      const data = await downloadManager.getDownloads();
      setDownloads(Array.isArray(data) ? [...data] : []);
    } catch (error) {
      console.error("❌ Downloads page load error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDownloads();
      const interval = setInterval(loadDownloads, 1000);
      return () => clearInterval(interval);
    }, [loadDownloads]),
  );

  const handlePlay = async (item) => {
    if (item.status !== downloadStates.COMPLETED) return;

    if (!item.fileUri) {
      Alert.alert(
        "Video not available",
        "The downloaded video file was not found.",
      );
      return;
    }

    console.log("▶️ PLAYING LOCAL VIDEO:", {
      title: item.title,
      fileUri: item.fileUri,
    });

    router.push({
      pathname: `/movies/player/${item.movieId}`,
      params: { local: item.fileUri },
    });
  };

  const handleSelectForParty = (item) => {
    if (item.status !== downloadStates.COMPLETED) return;

    if (!item.fileUri) {
      Alert.alert(
        "Video not available",
        "This download has no local file. Try downloading again.",
      );
      return;
    }

    if (selectForClip) {
      console.log("🎬 Selected downloaded movie for clip:", item.title);
      router.replace({
        pathname: "/clips/create",
        params: {
          movieId: String(item.movieId),
          movieTitle: item.title || "",
          localVideoUri: item.fileUri,
          startSeconds: "0",
        },
      });
      return;
    }

    console.log("🎬 Selected downloaded movie for party:", item.title);
    router.push({
      pathname: "/watch-party",
      params: {
        movieId: String(item.movieId),
        movieTitle: item.title,
        posterUrl: item.posterUrl || "",
      },
    });
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Download",
      "Delete this downloaded movie from the app?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await downloadManager.deleteDownload(id);
              await loadDownloads();
            } catch (error) {
              console.error("❌ Delete error:", error);
            }
          },
        },
      ],
    );
  };

  const clearCompleted = () => {
    Alert.alert("Clear Downloads", "Delete all completed downloads?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await downloadManager.clearCompleted();
          await loadDownloads();
        },
      },
    ]);
  };

  const active = downloads.filter(
    (d) =>
      d.status === downloadStates.DOWNLOADING ||
      d.status === downloadStates.QUEUED ||
      d.status === downloadStates.PAUSED,
  ).length;

  const completed = downloads.filter(
    (d) => d.status === downloadStates.COMPLETED,
  ).length;

  return (
    <ImageBackground
      source={require("../../assets/Images/Download.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0)" }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {loading ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator size="large" color="white" />
              <Text style={{ color: "#94a3b8", marginTop: 12 }}>
                Loading downloads...
              </Text>
            </View>
          ) : (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  paddingTop: 12,
                  paddingBottom: selectMode ? 4 : 16,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Pressable onPress={() => router.back()} hitSlop={10}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                  </Pressable>
                  <Text
                    style={{
                      color: "white",
                      fontSize: 21,
                      fontWeight: "800",
                    }}
                  >
                    Downloads
                  </Text>
                </View>

                {completed > 0 && !selectMode && (
                  <Pressable onPress={clearCompleted}>
                    <Text
                      style={{
                        color: "#f87171",
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      Clear All
                    </Text>
                  </Pressable>
                )}
              </View>

              {selectMode && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                  <Text
                    style={{
                      color: "#a5b4fc",
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    {selectForClip
                      ? "Pick a downloaded movie to make a clip"
                      : "Pick a downloaded movie to host a Watch Party"}
                  </Text>
                </View>
              )}

              {!selectMode && (
                <View
                  style={{
                    flexDirection: "row",
                    paddingHorizontal: 16,
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "rgba(255,255,255,0.08)",
                      borderRadius: 14,
                      padding: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 20,
                        fontWeight: "800",
                      }}
                    >
                      {active}
                    </Text>
                    <Text style={{ color: "#94a3b8", fontSize: 12 }}>
                      Active
                    </Text>
                  </View>

                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "rgba(255,255,255,0.08)",
                      borderRadius: 14,
                      padding: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#4ade80",
                        fontSize: 20,
                        fontWeight: "800",
                      }}
                    >
                      {completed}
                    </Text>
                    <Text style={{ color: "#94a3b8", fontSize: 12 }}>
                      Downloaded
                    </Text>
                  </View>
                </View>
              )}

              {downloads.length === 0 ? (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 30,
                  }}
                >
                  <Ionicons name="download-outline" size={64} color="#64748b" />
                  <Text
                    style={{
                      color: "#94a3b8",
                      fontSize: 17,
                      fontWeight: "700",
                      marginTop: 15,
                    }}
                  >
                    No downloads yet
                  </Text>
                  <Text
                    style={{
                      color: "#64748b",
                      fontSize: 13,
                      textAlign: "center",
                      marginTop: 7,
                    }}
                  >
                    {selectForClip
                      ? "Download a movie first, then come back here to make a clip from it."
                      : selectMode
                        ? "Download a movie first, then come back here to host a party with it."
                        : "Download a movie and it will appear here."}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={downloads}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={({ item }) => (
                    <DownloadCard
                      item={item}
                      onPlay={handlePlay}
                      onDelete={handleDelete}
                      selectMode={selectMode}
                      selectForClip={selectForClip}
                      onSelectForParty={handleSelectForParty}
                    />
                  )}
                  contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      tintColor="white"
                      onRefresh={() => {
                        setRefreshing(true);
                        loadDownloads();
                      }}
                    />
                  }
                />
              )}
            </>
          )}
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}
