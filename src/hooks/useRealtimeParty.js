import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  fetchPartyMessages,
  fetchPartyParticipants,
  sendPartyMessage,
  updatePlaybackState,
} from "../services/partyService";

export function useRealtimeParty(partyId) {
  const [party, setParty] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!partyId) return;
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      const [{ data: partyRow }, msgs, parts] = await Promise.all([
        supabase.from("watch_parties").select("*").eq("id", partyId).single(),
        fetchPartyMessages(partyId),
        fetchPartyParticipants(partyId),
      ]);

      if (cancelled) return;
      setParty(partyRow ?? null);
      setMessages(msgs);
      setParticipants(parts);
      setLoading(false);
    }

    bootstrap();

    const channel = supabase
      .channel(`watch-party:${partyId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "watch_parties",
          filter: `id=eq.${partyId}`,
        },
        (payload) => setParty(payload.new),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "watch_party_messages",
          filter: `party_id=eq.${partyId}`,
        },
        (payload) => setMessages((prev) => [...prev, payload.new]),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "watch_party_participants",
          filter: `party_id=eq.${partyId}`,
        },
        () => {
          fetchPartyParticipants(partyId).then(setParticipants);
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [partyId]);

  const sendMessage = useCallback(
    async (body) => {
      if (!partyId || !body.trim()) return;
      await sendPartyMessage(partyId, body.trim());
    },
    [partyId],
  );

  const broadcastPlayback = useCallback(
    async (status, positionSeconds) => {
      if (!partyId) return;
      await updatePlaybackState(partyId, status, positionSeconds);
    },
    [partyId],
  );

  return {
    party,
    messages,
    participants,
    loading,
    sendMessage,
    broadcastPlayback,
  };
}
