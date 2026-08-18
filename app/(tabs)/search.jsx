import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  searchMovies,
  getMovieDownloadUrl,
} from "../../src/services/movieService";

import { useLanguage } from "../../src/i18n/LanguageContext";
import { useDownloads } from "../../src/hooks/useDownloads";
import { downloadStates } from "../../src/services/downloadService";

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const { t } = useLanguage();

  const { downloads, downloadMovie } = useDownloads();

  const [fetchingMovieId, setFetchingMovieId] = useState(null);

  // ============================================================
  // SEARCH
  // ============================================================

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    const timeout = setTimeout(async () => {
      try {
        const data = await searchMovies(query);

        console.log(
          "🔎 Search results:",
          data,
        );

        setResults(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(
          "❌ Search error:",
          e,
        );

        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  // ============================================================
  // FIND EXISTING DOWNLOAD
  // ============================================================

  const getDownloadForMovie = (movieId) =>
    downloads.find(
      (d) => String(d.movieId) === String(movieId),
    );

  // ============================================================
  // DOWNLOAD FULL MOVIE
  // ============================================================

  const handleDownloadPress = async (movie) => {
    const existing = getDownloadForMovie(movie.id);

    // ----------------------------------------------------------
    // Already completed
    // ----------------------------------------------------------

    if (
      existing?.status ===
      downloadStates.COMPLETED
    ) {
      router.push("/downloads");
      return;
    }

    // ----------------------------------------------------------
    // Already downloading / queued
    // ----------------------------------------------------------

    if (
      existing &&
      (
        existing.status ===
          downloadStates.DOWNLOADING ||
        existing.status ===
          downloadStates.QUEUED
      )
    ) {
      router.push("/downloads");
      return;
    }

    // ----------------------------------------------------------
    // Check whether backend says download is available
    // ----------------------------------------------------------

    if (movie.downloadable !== true) {
      Alert.alert(
        "Download unavailable",
        "This movie does not have a full movie file available for download yet.",
      );

      return;
    }

    setFetchingMovieId(movie.id);

    try {
      console.log(
        "⬇️ Getting FULL MOVIE URL:",
        movie.id,
      );

      // IMPORTANT:
      //
      // Do NOT use:
      //
      // movie.video_url
      //
      // anymore.
      //
      // Backend will return the signed URL for:
      //
      // full-movies/<movie>.mp4
      //

      const downloadData =
        await getMovieDownloadUrl(movie.id);

      if (!downloadData?.video_url) {
        throw new Error(
          "Full movie download URL was not returned.",
        );
      }

      if (
        downloadData.video_type &&
        downloadData.video_type !== "full_movie"
      ) {
        throw new Error(
          "The download source is not a full movie.",
        );
      }

      console.log(
        "✅ FULL MOVIE URL received",
      );

      // --------------------------------------------------------
      // Send FULL MOVIE URL to download manager
      // --------------------------------------------------------

      await downloadMovie(
        movie.id,
        movie.title,
        movie.poster_url,
        downloadData.video_url,
      );

      Alert.alert(
        "Download started",
        `"${movie.title}" is downloading.`,
        [
          {
            text: "OK",
            style: "cancel",
          },
          {
            text: "View Downloads",
            onPress: () =>
              router.push("/downloads"),
          },
        ],
      );
    } catch (e) {
      console.error(
        "❌ Full movie download error:",
        e,
      );

      Alert.alert(
        "Couldn't start download",
        e instanceof Error
          ? e.message
          : "Full movie is not available for download.",
      );
    } finally {
      setFetchingMovieId(null);
    }
  };

  // ============================================================
  // DOWNLOAD ICON
  // ============================================================

  const renderDownloadIcon = (movie) => {
    const isFetching =
      fetchingMovieId === movie.id;

    const existing =
      getDownloadForMovie(movie.id);

    // ----------------------------------------------------------
    // Getting signed URL
    // ----------------------------------------------------------

    if (isFetching) {
      return (
        <ActivityIndicator
          size="small"
          color="white"
        />
      );
    }

    // ----------------------------------------------------------
    // Completed
    // ----------------------------------------------------------

    if (
      existing?.status ===
      downloadStates.COMPLETED
    ) {
      return (
        <Ionicons
          name="checkmark-circle"
          size={18}
          color="#4ade80"
        />
      );
    }

    // ----------------------------------------------------------
    // Downloading / queued
    // ----------------------------------------------------------

    if (
      existing?.status ===
        downloadStates.DOWNLOADING ||
      existing?.status ===
        downloadStates.QUEUED
    ) {
      return (
        <ActivityIndicator
          size="small"
          color="#60a5fa"
        />
      );
    }

    // ----------------------------------------------------------
    // Failed
    // ----------------------------------------------------------

    if (
      existing?.status ===
      downloadStates.FAILED
    ) {
      return (
        <Ionicons
          name="refresh"
          size={16}
          color="#f87171"
        />
      );
    }

    // ----------------------------------------------------------
    // Full movie available
    // ----------------------------------------------------------

    if (movie.downloadable === true) {
      return (
        <Ionicons
          name="download-outline"
          size={16}
          color="white"
        />
      );
    }

    // ----------------------------------------------------------
    // Full movie unavailable
    // ----------------------------------------------------------

    return (
      <Ionicons
        name="cloud-offline-outline"
        size={16}
        color="rgba(255,255,255,0.25)"
      />
    );
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <LinearGradient
      colors={["#3b82f6", "#4338ca"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ flex: 1 }}
    >
      <ImageBackground
        source={require("../../assets/Images/Search.png")}
        style={{ flex: 1 }}
        resizeMode="cover"
        imageStyle={{ opacity: 0.5 }}
      >
        <SafeAreaView
          style={{ flex: 1 }}
          edges={["top"]}
        >
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View style={{ flex: 1 }}>
              {/* ==================================================
                  HEADER
              ================================================== */}

              <View
                style={{
                  paddingHorizontal: 20,
                  paddingTop: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: "white",
                        fontSize: 28,
                        fontWeight: "800",
                      }}
                    >
                      {t("search_title")}
                    </Text>

                    <Text
                      style={{
                        color:
                          "rgba(255,255,255,0.8)",
                        marginTop: 4,
                      }}
                    >
                      {t("search_subtitle")}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      router.push("/downloads");
                    }}
                    hitSlop={10}
                    style={{
                      backgroundColor:
                        "rgba(255,255,255,0.15)",
                      borderRadius: 999,
                      padding: 10,
                    }}
                  >
                    <Ionicons
                      name="download-outline"
                      size={20}
                      color="white"
                    />
                  </Pressable>
                </View>

                {/* ==================================================
                    SEARCH INPUT
                ================================================== */}

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor:
                      "rgba(255,255,255,0.15)",
                    borderRadius: 16,
                    paddingHorizontal: 14,
                    marginTop: 20,
                    height: 50,
                  }}
                >
                  <Ionicons
                    name="search"
                    size={20}
                    color="rgba(255,255,255,0.8)"
                  />

                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={t(
                      "search_placeholder",
                    )}
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    style={{
                      flex: 1,
                      color: "white",
                      marginLeft: 10,
                      fontSize: 16,
                    }}
                    autoCapitalize="none"
                    returnKeyType="search"
                    onSubmitEditing={
                      Keyboard.dismiss
                    }
                  />

                  {query.length > 0 && (
                    <Pressable
                      onPress={() => {
                        setQuery("");
                        Keyboard.dismiss();
                      }}
                      hitSlop={10}
                    >
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color="rgba(255,255,255,0.7)"
                      />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* ==================================================
                  LOADING
              ================================================== */}

              {loading && (
                <View
                  style={{
                    paddingTop: 40,
                    alignItems: "center",
                  }}
                >
                  <ActivityIndicator color="white" />
                </View>
              )}

              {/* ==================================================
                  EMPTY SEARCH
              ================================================== */}

              {!loading &&
                query.trim().length === 0 && (
                  <View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 40,
                    }}
                  >
                    <Ionicons
                      name="film-outline"
                      size={48}
                      color="rgba(255,255,255,0.3)"
                    />

                    <Text
                      style={{
                        color:
                          "rgba(255,255,255,0.6)",
                        marginTop: 12,
                        textAlign: "center",
                      }}
                    >
                      Start typing to search the
                      movie catalog
                    </Text>
                  </View>
                )}

              {/* ==================================================
                  NO RESULTS
              ================================================== */}

              {!loading &&
                query.trim().length > 0 &&
                results.length === 0 && (
                  <View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color:
                          "rgba(255,255,255,0.6)",
                      }}
                    >
                      {t("search_no_results")}{" "}
                      {query}
                    </Text>
                  </View>
                )}

              {/* ==================================================
                  MOVIE LIST
              ================================================== */}

              <FlatList
                data={results}
                keyExtractor={(item) =>
                  String(item.id)
                }
                numColumns={2}
                columnWrapperStyle={{
                  gap: 14,
                  paddingHorizontal: 20,
                }}
                contentContainerStyle={{
                  gap: 14,
                  paddingTop: 20,
                  paddingBottom: 40,
                }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                renderItem={({ item }) => {
                  const downloadDisabled =
                    item.downloadable !== true;

                  return (
                    <Pressable
                      onPress={() => {
                        Keyboard.dismiss();

                        router.push(
                          `/movies/${item.id}`,
                        );
                      }}
                      style={{ flex: 1 }}
                    >
                      <View
                        style={{
                          borderRadius: 16,
                          overflow: "hidden",
                          backgroundColor:
                            "rgba(255,255,255,0.08)",
                        }}
                      >
                        {/* ==================================================
                            POSTER
                        ================================================== */}

                        <View>
                          {item.poster_url ? (
                            <Image
                              source={{
                                uri: item.poster_url,
                              }}
                              style={{
                                width: "100%",
                                aspectRatio: 2 / 3,
                              }}
                            />
                          ) : (
                            <View
                              style={{
                                width: "100%",
                                aspectRatio: 2 / 3,
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                              }}
                            >
                              <Ionicons
                                name="film-outline"
                                size={28}
                                color="rgba(255,255,255,0.4)"
                              />
                            </View>
                          )}

                          {/* ==================================================
                              DOWNLOAD BUTTON
                          ================================================== */}

                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              Keyboard.dismiss();

                              handleDownloadPress(
                                item,
                              );
                            }}
                            disabled={
                              downloadDisabled
                            }
                            hitSlop={8}
                            style={{
                              position:
                                "absolute",
                              top: 8,
                              right: 8,
                              width: 34,
                              height: 34,
                              borderRadius: 17,
                              alignItems:
                                "center",
                              justifyContent:
                                "center",

                              backgroundColor:
                                downloadDisabled
                                  ? "rgba(0,0,0,0.15)"
                                  : "rgba(0,0,0,0.65)",

                              opacity:
                                downloadDisabled
                                  ? 0.4
                                  : 1,

                              borderWidth:
                                downloadDisabled
                                  ? 1
                                  : 0,

                              borderColor:
                                "rgba(255,255,255,0.1)",
                            }}
                          >
                            {renderDownloadIcon(
                              item,
                            )}
                          </Pressable>
                        </View>

                        {/* ==================================================
                            MOVIE INFO
                        ================================================== */}

                        <View
                          style={{
                            padding: 10,
                          }}
                        >
                          <Text
                            numberOfLines={1}
                            style={{
                              color: "white",
                              fontWeight: "700",
                            }}
                          >
                            {item.title}
                          </Text>

                          <Text
                            style={{
                              color:
                                "rgba(255,255,255,0.7)",
                              fontSize: 12,
                              marginTop: 2,
                            }}
                          >
                            {item.release_date
                              ? new Date(
                                  item.release_date,
                                ).getFullYear()
                              : ""}{" "}
                            {item.genres?.[0]
                              ? `· ${item.genres[0]}`
                              : ""}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                }}
              />
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </ImageBackground>
    </LinearGradient>
  );
};

export default Search;