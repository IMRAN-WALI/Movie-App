import { Room, RoomEvent } from "livekit-client";
import { invokeEdgeFunction } from "./supabase";

const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL;

export async function fetchLiveKitToken(roomName, identity, displayName) {
  return invokeEdgeFunction("livekit-token", {
    roomName,
    identity,
    displayName,
  });
}

export async function connectToVoiceRoom(roomName, identity, displayName) {
  const { token } = await fetchLiveKitToken(roomName, identity, displayName);

  const room = new Room({
    adaptiveStream: true,
    dynacast: true,
  });

  await room.connect(LIVEKIT_URL, token);
  await room.localParticipant.setMicrophoneEnabled(true);

  return room;
}

export function attachSpeakingListener(room, onChange) {
  const handler = (speakers) => {
    onChange(new Set(speakers.map((s) => s.identity)));
  };

  room.on(RoomEvent.ActiveSpeakersChanged, handler);
  return () => room.off(RoomEvent.ActiveSpeakersChanged, handler);
}

export async function toggleMicrophone(room, enabled) {
  await room.localParticipant.setMicrophoneEnabled(enabled);
}

export async function leaveVoiceRoom(room) {
  room.disconnect();
}
