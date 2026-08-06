import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../src/lib/supabase";
import { useLanguage } from "../../../src/i18n/LanguageContext";
import { safeBack } from "../../../src/lib/safeBack";

const MoviePlayerScreen = () => {
  const { id } = useLocalSearchParams();
  const { t } = useLanguage();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentTimeRef = useRef(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      const { data, error: fetchError } = await supabase
        .from("movies")
        .select("id, title, video_url, poster_url")
        .eq("id", id)
        .single();

      if (cancelled) return;

      if (fetchError || !data?.video_url) {
        setError(t("player_no_video"));
      } else {
        setMovie(data);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id, t]);

  const player = useVideoPlayer(movie?.video_url ?? "", (p) => {
    p.loop = false;
  });

  // Keep track of playback position so "Clip This Moment" knows where to start.
  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      currentTimeRef.current = player.currentTime ?? 0;
    }, 500);
    return () => clearInterval(interval);
  }, [player]);

  const handleClipThisMoment = () => {
    player.pause();
    const startSeconds = Math.max(0, Math.floor(currentTimeRef.current));
    router.push({
      pathname: "/clips/create",
      params: {
        movieId: id,
        movieTitle: movie?.title ?? "",
        videoUrl: movie?.video_url ?? "",
        startSeconds: String(startSeconds),
      },
    });
  };

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
        <ActivityIndicator color="white" size="large" />
      </View>
    );
  }

  if (error || !movie) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "black",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <Ionicons name="film-outline" size={40} color="#475569" />
        <Text style={{ color: "#94a3b8", marginTop: 12, textAlign: "center" }}>
          {error || t("player_no_video")}
        </Text>
        <Pressable
          onPress={() => safeBack("/(tabs)")}
          style={{ marginTop: 20 }}
        >
          <Text style={{ color: "#818cf8", fontWeight: "700" }}>
            {t("party_go_back")}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <StatusBar hidden />
      <VideoView
        player={player}
        style={{ flex: 1 }}
        nativeControls
        allowsFullscreen
        contentFit="contain"
      />

      {/* Top bar */}
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
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: 10,
          }}
        >
          <Pressable
            onPress={() => safeBack(`/movies/${id}`)}
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

          <Pressable
            onPress={handleClipThisMoment}
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
            <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>
              {t("player_clip_this_moment")}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default MoviePlayerScreen;
