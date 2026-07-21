// src/hooks/useRealtimeParty.js - Updated with proper message handling

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useRealtimeParty(sessionId) {
  const [party, setParty] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      console.log("❌ No sessionId");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        console.log("🔍 Fetching party:", sessionId);
        setLoading(true);

        // Fetch party
        const { data: partyData, error: partyError } = await supabase
          .from("watch_parties")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (partyError) {
          console.error("❌ Party error:", partyError);
          setLoading(false);
          return;
        }

        console.log("✅ Party loaded:", partyData);
        setParty(partyData);

        // Fetch participants
        const { data: participantsData } = await supabase
          .from("party_participants")
          .select("*")
          .eq("party_id", sessionId);

        console.log("✅ Participants loaded:", participantsData?.length || 0);
        setParticipants(participantsData || []);

        // ✅ Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from("party_messages")
          .select("*")
          .eq("party_id", sessionId)
          .order("created_at", { ascending: true });

        if (messagesError) {
          console.error("❌ Messages fetch error:", messagesError);
        } else {
          console.log("✅ Messages loaded:", messagesData?.length || 0);
          setMessages(messagesData || []);
        }
      } catch (error) {
        console.error("❌ Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // ✅ Real-time subscription for messages
    const channel = supabase.channel(`party-messages:${sessionId}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "party_messages",
          filter: `party_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log("💬 New message received:", payload.new);
          setMessages((prev) => [...prev, payload.new]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "party_participants",
          filter: `party_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log("👤 New participant:", payload.new);
          setParticipants((prev) => [...prev, payload.new]);
        },
      )
      .subscribe((status) => {
        console.log("📡 Subscription status:", status);
      });

    return () => {
      console.log("🔌 Unsubscribing");
      channel.unsubscribe();
    };
  }, [sessionId]);

  // ✅ Send message function
  const sendMessage = async (text) => {
    if (!text.trim() || !sessionId) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("❌ No user logged in");
        return;
      }

      console.log("📤 Sending message:", text);

      const { data, error } = await supabase
        .from("party_messages")
        .insert({
          party_id: sessionId,
          user_id: user.id,
          content: text.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Send message error:", error);
      } else {
        console.log("✅ Message sent:", data);
        // ✅ Optimistically add to UI
        setMessages((prev) => [...prev, data]);
      }
    } catch (error) {
      console.error("❌ Send message error:", error);
    }
  };

  const broadcastPlayback = async (data) => {
    try {
      await supabase.channel(`party-messages:${sessionId}`).send({
        type: "broadcast",
        event: "playback",
        payload: data,
      });
    } catch (error) {
      console.error("❌ Broadcast error:", error);
    }
  };

  return {
    party,
    messages,
    participants,
    loading,
    sendMessage,
    broadcastPlayback,
  };
}
