import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useRef } from "react";
import { View } from "react-native";

// Tolerance before we force a seek to re-sync with the host's position.
const DRIFT_TOLERANCE_SECONDS = 1.5;

const VideoSyncPlayer = ({ videoUrl, party, isHost, onLocalChange }) => {
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
  });
  const applyingRemoteUpdate = useRef(false);

  // Guests: react to remote playback state changes.
  useEffect(() => {
    if (!party || isHost) return;

    applyingRemoteUpdate.current = true;

    const drift = Math.abs(
      player.currentTime - party.playback_position_seconds,
    );
    if (drift > DRIFT_TOLERANCE_SECONDS) {
      player.currentTime = party.playback_position_seconds;
    }

    if (party.status === "playing") {
      player.play();
    } else if (party.status === "paused" || party.status === "waiting") {
      player.pause();
    }

    const timeout = setTimeout(() => {
      applyingRemoteUpdate.current = false;
    }, 300);
    return () => clearTimeout(timeout);
  }, [party?.status, party?.playback_position_seconds, isHost]);

  // Host: broadcast local play/pause/seek actions.
  useEffect(() => {
    if (!isHost) return;

    const sub = player.addListener("playingChange", (event) => {
      if (applyingRemoteUpdate.current) return;
      onLocalChange(event.isPlaying ? "playing" : "paused", player.currentTime);
    });

    const seekSub = player.addListener("statusChange", () => {
      // expo-video doesn't emit a discrete "seek" event; periodic position
      // broadcasts (below) cover drift from host-side seeking.
    });

    return () => {
      sub.remove();
      seekSub.remove();
    };
  }, [isHost, onLocalChange, player]);

  // Host: periodic heartbeat so late-joining guests can catch up.
  useEffect(() => {
    if (!isHost) return;
    const interval = setInterval(() => {
      if (player.playing) {
        onLocalChange("playing", player.currentTime);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isHost, onLocalChange, player]);

  return (
    <View
      style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "black" }}
    >
      <VideoView
        player={player}
        style={{ width: "100%", height: "100%" }}
        allowsFullscreen
        nativeControls={isHost}
      />
    </View>
  );
};

export default VideoSyncPlayer;
