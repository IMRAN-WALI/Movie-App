import { useCallback, useEffect, useRef, useState } from "react";
import {
  attachSpeakingListener,
  connectToVoiceRoom,
  leaveVoiceRoom,
  toggleMicrophone,
} from "../lib/livekit";

export function useLiveKitRoom(roomName, identity, displayName) {
  const [room, setRoom] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [speakingIdentities, setSpeakingIdentities] = useState(new Set());
  const [isMuted, setIsMuted] = useState(false);
  const roomRef = useRef(null);

  useEffect(() => {
    if (!roomName || !identity) return;
    let cancelled = false;
    let detachSpeaking = null;

    async function connect() {
      setConnecting(true);
      setError(null);
      try {
        const r = await connectToVoiceRoom(roomName, identity, displayName);
        if (cancelled) {
          leaveVoiceRoom(r);
          return;
        }
        roomRef.current = r;
        setRoom(r);
        setConnected(true);
        detachSpeaking = attachSpeakingListener(r, setSpeakingIdentities);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to join voice");
      } finally {
        if (!cancelled) setConnecting(false);
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (detachSpeaking) detachSpeaking();
      if (roomRef.current) {
        leaveVoiceRoom(roomRef.current);
        roomRef.current = null;
      }
      setConnected(false);
      setRoom(null);
    };
  }, [roomName, identity, displayName]);

  const toggleMute = useCallback(async () => {
    if (!roomRef.current) return;
    const nextMuted = !isMuted;
    await toggleMicrophone(roomRef.current, !nextMuted);
    setIsMuted(nextMuted);
  }, [isMuted]);

  const leave = useCallback(async () => {
    if (roomRef.current) {
      await leaveVoiceRoom(roomRef.current);
      roomRef.current = null;
      setRoom(null);
      setConnected(false);
    }
  }, []);

  return {
    room,
    connected,
    connecting,
    error,
    speakingIdentities,
    isMuted,
    toggleMute,
    leave,
  };
}
