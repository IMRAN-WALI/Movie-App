import React, { useCallback, useMemo, useState } from "react";
import { PanResponder, Text, View } from "react-native";

const MAX_CLIP_SECONDS = 10;
const HANDLE_WIDTH = 20;

const ClipTrimmer = ({ videoUri, totalDurationSeconds, onChange }) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const [startPct, setStartPct] = useState(0);
  const maxWindowPct = Math.min(
    1,
    MAX_CLIP_SECONDS / Math.max(totalDurationSeconds, MAX_CLIP_SECONDS),
  );
  const [windowPct, setWindowPct] = useState(maxWindowPct);

  const startSeconds = startPct * totalDurationSeconds;
  const endSeconds = Math.min(
    totalDurationSeconds,
    (startPct + windowPct) * totalDurationSeconds,
  );

  const commit = useCallback(
    (nextStartPct, nextWindowPct) => {
      const clampedStart = Math.max(
        0,
        Math.min(nextStartPct, 1 - nextWindowPct),
      );
      setStartPct(clampedStart);
      setWindowPct(nextWindowPct);
      const s = clampedStart * totalDurationSeconds;
      const e = Math.min(
        totalDurationSeconds,
        (clampedStart + nextWindowPct) * totalDurationSeconds,
      );
      onChange(Math.round(s * 10) / 10, Math.round(e * 10) / 10);
    },
    [onChange, totalDurationSeconds],
  );

  const leftPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gesture) => {
          if (trackWidth === 0) return;
          const deltaPct = gesture.dx / trackWidth;
          commit(startPct + deltaPct, windowPct - deltaPct);
        },
      }),
    [trackWidth, startPct, windowPct, commit],
  );

  const rightPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gesture) => {
          if (trackWidth === 0) return;
          const deltaPct = gesture.dx / trackWidth;
          const nextWindow = Math.min(
            maxWindowPct,
            Math.max(1 / totalDurationSeconds, windowPct + deltaPct),
          );
          commit(startPct, nextWindow);
        },
      }),
    [
      trackWidth,
      startPct,
      windowPct,
      maxWindowPct,
      totalDurationSeconds,
      commit,
    ],
  );

  const wholeClipPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gesture) => {
          if (trackWidth === 0) return;
          const deltaPct = gesture.dx / trackWidth;
          commit(startPct + deltaPct, windowPct);
        },
      }),
    [trackWidth, startPct, windowPct, commit],
  );

  const onTrackLayout = (e) => setTrackWidth(e.nativeEvent.layout.width);

  return (
    <View>
      <View
        style={{
          width: "100%",
          aspectRatio: 9 / 16,
          backgroundColor: "#0f172a",
          borderRadius: 16,
          overflow: "hidden",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#94a3b8", fontSize: 13 }}>
          Clip preview will appear here
        </Text>
      </View>

      <Text style={{ color: "white", textAlign: "center", marginTop: 12 }}>
        {startSeconds.toFixed(1)}s – {endSeconds.toFixed(1)}s (
        {(endSeconds - startSeconds).toFixed(1)}s clip)
      </Text>

      <View
        onLayout={onTrackLayout}
        style={{
          height: 44,
          backgroundColor: "#1e293b",
          borderRadius: 8,
          marginTop: 12,
          overflow: "visible",
          justifyContent: "center",
        }}
      >
        <View
          {...wholeClipPanResponder.panHandlers}
          style={{
            position: "absolute",
            left: `${startPct * 100}%`,
            width: `${windowPct * 100}%`,
            height: "100%",
            backgroundColor: "rgba(99,102,241,0.35)",
            borderRadius: 6,
          }}
        />
        <View
          {...leftPanResponder.panHandlers}
          style={{
            position: "absolute",
            left: `${startPct * 100}%`,
            width: HANDLE_WIDTH,
            height: "100%",
            marginLeft: -HANDLE_WIDTH / 2,
            backgroundColor: "#6366f1",
            borderRadius: 6,
          }}
        />
        <View
          {...rightPanResponder.panHandlers}
          style={{
            position: "absolute",
            left: `${(startPct + windowPct) * 100}%`,
            width: HANDLE_WIDTH,
            height: "100%",
            marginLeft: -HANDLE_WIDTH / 2,
            backgroundColor: "#6366f1",
            borderRadius: 6,
          }}
        />
      </View>
      <Text
        style={{
          color: "#64748b",
          fontSize: 12,
          marginTop: 8,
          textAlign: "center",
        }}
      >
        Drag the handles to trim — max {MAX_CLIP_SECONDS}s
      </Text>
    </View>
  );
};

export default ClipTrimmer;
