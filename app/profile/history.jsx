import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
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
import { useLanguage } from "../../src/i18n/LanguageContext";
import { supabase } from "../../src/lib/supabase";

const LOCALE_MAP = {
  en: "en-US",
  ur: "ur-PK",
  ar: "ar-SA",
  hi: "hi-IN",
};

function timeAgo(dateString, locale) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 30) return `${days}d`;
  return new Date(dateString).toLocaleDateString(locale);
}

function formatExactDateTime(dateString, language) {
  const locale = LOCALE_MAP[language] || "en-US";
  const date = new Date(dateString);
  const datePart = date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} • ${timePart}`;
}

function HistoryCard({ item, t, locale, onDelete }) {
  const movie = item.movies;
  const runtimeMin = movie?.runtime || 0;
  const watchedMin = Math.floor((item.progress_seconds || 0) / 60);
  const percent =
    runtimeMin > 0
      ? Math.min(100, Math.round((watchedMin / runtimeMin) * 100))
      : item.completed
        ? 100
        : 0;
  const minutesLeft = Math.max(0, runtimeMin - watchedMin);

  const confirmDelete = () => {
    Alert.alert(t("history_delete_title"), t("history_delete_message"), [
      { text: t("profile_cancel"), style: "cancel" },
      {
        text: t("history_delete_confirm"),
        style: "destructive",
        onPress: () => onDelete(item.id),
      },
    ]);
  };

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/movies/[id]", params: { id: item.movie_id } })
      }
      style={{
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: 10,
        marginBottom: 12,
      }}
    >
      {movie?.poster_url ? (
        <Image
          source={{ uri: movie.poster_url }}
          style={{ width: 64, height: 96, borderRadius: 10 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: 64,
            height: 96,
            borderRadius: 10,
            backgroundColor: "rgba(255,255,255,0.1)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="film-outline"
            size={22}
            color="rgba(255,255,255,0.4)"
          />
        </View>
      )}

      <View style={{ flex: 1, marginLeft: 12, justifyContent: "center" }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Text
            numberOfLines={2}
            style={{ color: "white", fontSize: 15, fontWeight: "700", flex: 1 }}
          >
            {movie?.title || `Movie #${item.movie_id}`}
          </Text>

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              confirmDelete();
            }}
            hitSlop={10}
            style={{ marginLeft: 8, padding: 2 }}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color="rgba(255,255,255,0.4)"
            />
          </Pressable>
        </View>

        <Text
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 12,
            marginTop: 4,
          }}
        >
          {timeAgo(item.watched_at, locale)}
        </Text>

        <Text
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 11,
            marginTop: 2,
          }}
        >
          {formatExactDateTime(item.watched_at, locale)}
        </Text>

        {/* Status badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 8,
            gap: 6,
          }}
        >
          {item.completed ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(34,197,94,0.18)",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
                gap: 4,
              }}
            >
              <Ionicons name="checkmark-circle" size={12} color="#4ade80" />
              <Text
                style={{ color: "#4ade80", fontSize: 11, fontWeight: "700" }}
              >
                {t("history_completed")}
              </Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(99,102,241,0.18)",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
                gap: 4,
              }}
            >
              <Ionicons name="play-circle" size={12} color="#a5b4fc" />
              <Text
                style={{ color: "#a5b4fc", fontSize: 11, fontWeight: "700" }}
              >
                {t("history_in_progress")}
              </Text>
            </View>
          )}
        </View>

        {/* Progress bar (only while in progress and runtime known) */}
        {!item.completed && runtimeMin > 0 && (
          <View style={{ marginTop: 8 }}>
            <View
              style={{
                height: 4,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.12)",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${percent}%`,
                  backgroundColor: "#818cf8",
                  borderRadius: 2,
                }}
              />
            </View>
            <Text
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 10,
                marginTop: 3,
              }}
            >
              {minutesLeft} {t("history_min_left")}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const HistoryScreen = () => {
  const { t, language } = useLanguage();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.id);

    const { data, error } = await supabase
      .from("watch_history")
      .select("*, movies(title, poster_url, runtime)")
      .eq("user_id", user.id)
      .order("watched_at", { ascending: false });

    if (error) {
      console.error("❌ Watch history fetch error:", error);
    } else {
      setHistory(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  // Delete a single history entry
  const handleDeleteItem = async (id) => {
    const previous = history;
    // Optimistic UI update
    setHistory((prev) => prev.filter((h) => h.id !== id));

    const { error } = await supabase
      .from("watch_history")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("❌ Delete history item error:", error);
      setHistory(previous); // rollback on failure
      Alert.alert(t("profile_error"), t("profile_sign_out_error"));
    }
  };

  // Delete everything for this user
  const handleClearAll = () => {
    if (history.length === 0 || !userId) return;

    Alert.alert(t("history_clear_all_title"), t("history_clear_all_message"), [
      { text: t("profile_cancel"), style: "cancel" },
      {
        text: t("history_delete_confirm"),
        style: "destructive",
        onPress: async () => {
          const previous = history;
          setHistory([]);

          const { error } = await supabase
            .from("watch_history")
            .delete()
            .eq("user_id", userId);

          if (error) {
            console.error("❌ Clear all history error:", error);
            setHistory(previous);
            Alert.alert(t("profile_error"), t("profile_sign_out_error"));
          }
        },
      },
    ]);
  };

  return (
    <LinearGradient
      colors={["#3730a3", "#312e81"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Pressable onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <View>
              <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>
                {t("history_title")}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                {t("history_subtitle")}
              </Text>
            </View>
          </View>

          {history.length > 0 && (
            <Pressable
              onPress={handleClearAll}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: "rgba(248,113,113,0.15)",
              }}
            >
              <Ionicons name="trash-outline" size={14} color="#f87171" />
              <Text
                style={{ color: "#f87171", fontSize: 12, fontWeight: "700" }}
              >
                {t("history_clear_all")}
              </Text>
            </Pressable>
          )}
        </View>

        {loading ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator color="white" size="large" />
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <HistoryCard
                item={item}
                t={t}
                locale={language}
                onDelete={handleDeleteItem}
              />
            )}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 40,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="white"
              />
            }
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: 60,
                }}
              >
                <Ionicons
                  name="time-outline"
                  size={54}
                  color="rgba(255,255,255,0.25)"
                />
                <Text
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 15,
                    fontWeight: "600",
                    marginTop: 14,
                  }}
                >
                  {t("history_empty_title")}
                </Text>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: 12,
                    marginTop: 4,
                    textAlign: "center",
                    paddingHorizontal: 30,
                  }}
                >
                  {t("history_empty_subtitle")}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

export default HistoryScreen;
