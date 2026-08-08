import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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

function DownloadCard({ item, onPlay, onDelete }) {
  const completed = item.status === downloadStates.COMPLETED;

  const downloading = item.status === downloadStates.DOWNLOADING;

  const queued = item.status === downloadStates.QUEUED;

  const failed = item.status === downloadStates.FAILED;

  const paused = item.status === downloadStates.PAUSED;

  const progress = Math.round(
    Math.max(0, Math.min(1, Number(item.progress) || 0)) * 100,
  );

  return (
    <Pressable
      onPress={() => {
        if (completed) {
          onPlay(item);
        }
      }}
      style={{
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {/* POSTER */}

      {item.posterUrl ? (
        <Image
          source={{
            uri: item.posterUrl,
          }}
          style={{
            width: 64,
            height: 88,
            borderRadius: 8,
          }}
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

      {/* INFO */}

      <View
        style={{
          flex: 1,
          marginLeft: 12,
        }}
      >
        <Text
          style={{
            color: "white",
            fontWeight: "800",
            fontSize: 15,
          }}
          numberOfLines={1}
        >
          {item.title}
        </Text>

        {/* STATUS */}

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

        {/* PROGRESS */}

        {(downloading || queued || paused || completed) && (
          <View
            style={{
              height: 5,
              borderRadius: 3,
              backgroundColor: "rgba(255,255,255,0.1)",
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

        {completed && (
          <Text
            style={{
              color: "#64748b",
              fontSize: 10,
              marginTop: 4,
            }}
          >
            100% • Available offline
          </Text>
        )}
      </View>

      {/* PLAY */}

      {completed && (
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

      {/* DELETE */}

      <Pressable
        onPress={() => onDelete(item.id)}
        hitSlop={10}
        style={{
          padding: 8,
        }}
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
  const [downloads, setDownloads] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  // ===================================================
  // LOAD
  // ===================================================

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

  // ===================================================
  // REFRESH WHEN PAGE OPENS
  // ===================================================

  useFocusEffect(
    useCallback(() => {
      loadDownloads();

      const interval = setInterval(loadDownloads, 1000);

      return () => clearInterval(interval);
    }, [loadDownloads]),
  );

  // ===================================================
  // PLAY LOCAL VIDEO
  // ===================================================

  const handlePlay = async (item) => {
    if (item.status !== downloadStates.COMPLETED) {
      return;
    }

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

      params: {
        local: item.fileUri,
      },
    });
  };

  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Download",
      "Delete this downloaded movie from the app?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

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

  // ===================================================
  // CLEAR COMPLETED
  // ===================================================

  const clearCompleted = () => {
    Alert.alert("Clear Downloads", "Delete all completed downloads?", [
      {
        text: "Cancel",
        style: "cancel",
      },

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

  // ===================================================
  // COUNTERS
  // ===================================================

  const active = downloads.filter(
    (d) =>
      d.status === downloadStates.DOWNLOADING ||
      d.status === downloadStates.QUEUED ||
      d.status === downloadStates.PAUSED,
  ).length;

  const completed = downloads.filter(
    (d) => d.status === downloadStates.COMPLETED,
  ).length;

  // ===================================================
  // LOADING
  // ===================================================

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
        <ActivityIndicator size="large" color="white" />

        <Text
          style={{
            color: "#94a3b8",
            marginTop: 12,
          }}
        >
          Loading downloads...
        </Text>
      </SafeAreaView>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#0f172a",
      }}
      edges={["top"]}
    >
      {/* HEADER */}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 16,
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

        {completed > 0 && (
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

      {/* STATS */}

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
            backgroundColor: "rgba(255,255,255,0.06)",
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

          <Text
            style={{
              color: "#94a3b8",
              fontSize: 12,
            }}
          >
            Active
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(255,255,255,0.06)",
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

          <Text
            style={{
              color: "#94a3b8",
              fontSize: 12,
            }}
          >
            Downloaded
          </Text>
        </View>
      </View>

      {/* LIST */}

      {downloads.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 30,
          }}
        >
          <Ionicons name="download-outline" size={64} color="#334155" />

          <Text
            style={{
              color: "#64748b",
              fontSize: 17,
              fontWeight: "700",
              marginTop: 15,
            }}
          >
            No downloads yet
          </Text>

          <Text
            style={{
              color: "#475569",
              fontSize: 13,
              textAlign: "center",
              marginTop: 7,
            }}
          >
            Download a movie and it will appear here.
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
            />
          )}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 40,
          }}
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
    </SafeAreaView>
  );
}
