import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "../../../src/lib/supabase";
import { useLanguage } from "../../../src/i18n/LanguageContext";
import { safeBack } from "../../../src/lib/safeBack";

export default function MoviePlayerScreen() {
  const params = useLocalSearchParams();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const local = Array.isArray(params.local) ? params.local[0] : params.local;

  const { t } = useLanguage();

  const [movie, setMovie] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const currentTimeRef = useRef(0);

  // =================================================
  // LOCAL VIDEO
  // =================================================

  const localVideoUri = local ? decodeURIComponent(local) : null;

  const isLocal = Boolean(localVideoUri);

  // =================================================
  // LOAD MOVIE INFO
  // =================================================

  useEffect(() => {
    if (!id) {
      setError(t("player_no_video"));

      setLoading(false);

      return;
    }

    let cancelled = false;

    async function loadMovie() {
      try {
        const { data, error: fetchError } = await supabase
          .from("movies")
          .select("id, title, video_url, poster_url")
          .eq("id", id)
          .single();

        if (cancelled) {
          return;
        }

        if (fetchError) {
          /*
           * For a downloaded movie,
           * local file is enough.
           */

          if (isLocal) {
            setMovie({
              id,
              title: "Downloaded Movie",
              video_url: null,
              poster_url: null,
            });
          } else {
            setError(t("player_no_video"));
          }

          setLoading(false);

          return;
        }

        setMovie(data);

        setLoading(false);
      } catch (err) {
        console.error("❌ Player movie error:", err);

        if (isLocal) {
          setMovie({
            id,
            title: "Downloaded Movie",
            video_url: null,
            poster_url: null,
          });
        } else {
          setError(t("player_no_video"));
        }

        setLoading(false);
      }
    }

    loadMovie();

    return () => {
      cancelled = true;
    };
  }, [id, isLocal, t]);

  // =================================================
  // VIDEO SOURCE
  // =================================================

  /*
   * LOCAL FILE ALWAYS WINS.
   *
   * Downloads page sends:
   *
   * local=file:///.../movie.mp4
   *
   * Normal player uses:
   *
   * movie.video_url
   */

  const videoSource = localVideoUri || movie?.video_url || "";

  // =================================================
  // VIDEO PLAYER
  // =================================================

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
  });

  // =================================================
  // TRACK CURRENT TIME
  // =================================================

  useEffect(() => {
    if (!player) {
      return;
    }

    const interval = setInterval(() => {
      currentTimeRef.current = player.currentTime || 0;
    }, 500);

    return () => clearInterval(interval);
  }, [player]);

  // =================================================
  // CLIP
  // =================================================

  const handleClip = () => {
    if (!player) {
      return;
    }

    player.pause();

    const startSeconds = Math.max(0, Math.floor(currentTimeRef.current));

    router.push({
      pathname: "/clips/create",

      params: {
        movieId: String(id),

        movieTitle: movie?.title || "",

        videoUrl: videoSource,

        startSeconds: String(startSeconds),
      },
    });
  };

  // =================================================
  // LOADING
  // =================================================

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "black",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  // =================================================
  // ERROR
  // =================================================

  if (error || !movie || !videoSource) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "black",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Ionicons name="alert-circle-outline" size={55} color="#64748b" />

        <Text
          style={{
            color: "#94a3b8",
            marginTop: 12,
            textAlign: "center",
          }}
        >
          {error || t("player_no_video")}
        </Text>

        <Pressable
          onPress={() => safeBack(isLocal ? "/downloads" : "/(tabs)")}
          style={{
            marginTop: 20,
          }}
        >
          <Text
            style={{
              color: "#818cf8",
              fontWeight: "700",
            }}
          >
            {t("party_go_back")}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // =================================================
  // PLAYER UI
  // =================================================

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "black",
      }}
    >
      <VideoView
        player={player}
        style={{
          flex: 1,
        }}
        nativeControls
        allowsFullscreen
        contentFit="contain"
      />

      <SafeAreaView
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
        }}
        edges={["top"]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 10,
          }}
        >
          {/* BACK */}

          <Pressable
            onPress={() => safeBack(isLocal ? "/downloads" : `/movies/${id}`)}
            hitSlop={12}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.5)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="chevron-back" size={22} color="white" />
          </Pressable>

          {/* DOWNLOADED */}

          {isLocal && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: "rgba(34,197,94,0.9)",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
              }}
            >
              <Ionicons name="download" size={15} color="white" />

              <Text
                style={{
                  color: "white",
                  fontWeight: "700",
                  fontSize: 12,
                }}
              >
                Downloaded
              </Text>
            </View>
          )}

          {/* CLIP */}

          <Pressable
            onPress={handleClip}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: "rgba(79,70,229,0.9)",
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 999,
            }}
          >
            <Ionicons name="cut-outline" size={16} color="white" />

            <Text
              style={{
                color: "white",
                fontWeight: "700",
                fontSize: 13,
              }}
            >
              {t("player_clip_this_moment")}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
