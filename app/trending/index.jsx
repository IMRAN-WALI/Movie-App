import React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import TrendingList from "../../src/components/trending/TrendingList";
import { useTrendingNearby } from "../../src/hooks/useTrendingNearby";

export default function TrendingScreen() {
  const { movies, city, loading, error, permissionDenied, refresh } =
    useTrendingNearby();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#0F172A",
      }}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor="#FFFFFF"
          />
        }
        contentContainerStyle={{
          flexGrow: 1,
        }}
      >
        {/* Header */}

        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 10,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 28,
              fontWeight: "800",
            }}
          >
             Trending Near You
          </Text>

          {city ? (
            <Text
              style={{
                color: "#94A3B8",
                marginTop: 6,
                fontSize: 15,
              }}
            >
               {city}
            </Text>
          ) : null}
        </View>

        {/* Loading */}

        {loading && (
          <View
            style={{
              flex: 1,
              minHeight: 400,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color="#FFFFFF" />

            <Text
              style={{
                color: "#94A3B8",
                marginTop: 15,
              }}
            >
              Finding movies near you...
            </Text>
          </View>
        )}

        {/* Permission */}

        {!loading && permissionDenied && (
          <View
            style={{
              flex: 1,
              minHeight: 450,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 25,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 20,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
               Location Permission Required
            </Text>

            <Text
              style={{
                color: "#94A3B8",
                textAlign: "center",
                marginTop: 10,
                lineHeight: 22,
              }}
            >
              Please allow location permission to discover trending movies
              around you.
            </Text>

            <Pressable
              onPress={refresh}
              style={{
                marginTop: 25,
                backgroundColor: "#6366F1",
                paddingHorizontal: 30,
                paddingVertical: 14,
                borderRadius: 14,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontWeight: "700",
                }}
              >
                Try Again
              </Text>
            </Pressable>
          </View>
        )}

        {/* Error */}

        {!loading && error && (
          <View
            style={{
              padding: 25,
            }}
          >
            <Text
              style={{
                color: "#EF4444",
                textAlign: "center",
                fontSize: 16,
                marginBottom: 15,
              }}
            >
              {error}
            </Text>

            <Pressable
              onPress={refresh}
              style={{
                alignSelf: "center",
                backgroundColor: "#6366F1",
                paddingHorizontal: 25,
                paddingVertical: 12,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontWeight: "700",
                }}
              >
                Retry
              </Text>
            </Pressable>
          </View>
        )}

        {/* Movies */}

        {!loading && !permissionDenied && !error && (
          <TrendingList movies={movies} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
