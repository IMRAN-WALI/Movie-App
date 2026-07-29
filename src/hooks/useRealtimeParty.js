import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  deriveRoomKey,
  encryptMessage,
  decryptMessage,
} from "../utils/encryption";

export function useRealtimeParty(sessionId) {
  const [party, setParty] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Room key is derived once we know the party's invite code — it never
  // touches the network, so it doubles as the "encryption key" for E2EE.
  const roomKey = useMemo(() => {
    if (!party?.id || !party?.invite_code) return null;
    return deriveRoomKey(party.id, party.invite_code);
  }, [party?.id, party?.invite_code]);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

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

        const key = deriveRoomKey(partyData.id, partyData.invite_code);

        // Fetch participants
        const { data: participantsData } = await supabase
          .from("party_participants")
          .select("*")
          .eq("party_id", sessionId);

        console.log("✅ Participants loaded:", participantsData?.length || 0);
        setParticipants(participantsData || []);

        // ✅ Fetch messages (decrypt each one for display)
        const { data: messagesData, error: messagesError } = await supabase
          .from("party_messages")
          .select("*")
          .eq("party_id", sessionId)
          .order("created_at", { ascending: true });

        if (messagesError) {
          console.error("❌ Messages fetch error:", messagesError);
        } else {
          console.log("✅ Messages loaded:", messagesData?.length || 0);
          const decrypted = (messagesData || []).map((m) => ({
            ...m,
            content: decryptMessage(m.content, key),
            read_by: m.read_by || [],
          }));
          setMessages(decrypted);
        }
      } catch (error) {
        console.error("❌ Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // ✅ Real-time subscription for messages (new messages + read receipt updates)
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
          setParty((currentParty) => {
            const key = deriveRoomKey(
              currentParty?.id,
              currentParty?.invite_code,
            );
            const decryptedMsg = {
              ...payload.new,
              content: decryptMessage(payload.new.content, key),
              read_by: payload.new.read_by || [],
            };
            setMessages((prev) => {
              if (prev.some((m) => m.id === decryptedMsg.id)) return prev;
              return [...prev, decryptedMsg];
            });
            return currentParty;
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "party_messages",
          filter: `party_id=eq.${sessionId}`,
        },
        (payload) => {
          // Someone read a message (or messages) — update ticks live.
          console.log("👀 Message updated (read receipt):", payload.new.id);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.new.id
                ? { ...m, read_by: payload.new.read_by || [] }
                : m,
            ),
          );
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

  // ✅ Send message function (encrypts before sending)
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

      console.log("📤 Sending message");

      const cipherText = encryptMessage(text.trim(), roomKey);

      const { data, error } = await supabase
        .from("party_messages")
        .insert({
          party_id: sessionId,
          user_id: user.id,
          content: cipherText,
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Send message error:", error);
      } else {
        console.log("✅ Message sent (encrypted)");
        setMessages((prev) => [
          ...prev,
          { ...data, content: text.trim(), read_by: data.read_by || [] },
        ]);
      }
    } catch (error) {
      console.error("❌ Send message error:", error);
    }
  };

  // ✅ Mark all messages from OTHER users as read by me (blue-tick logic)
  const markMessagesAsRead = async () => {
    if (!currentUserId || messages.length === 0) return;

    const unread = messages.filter(
      (m) =>
        m.user_id !== currentUserId &&
        !(m.read_by || []).includes(currentUserId),
    );

    if (unread.length === 0) return;

    for (const msg of unread) {
      const newReadBy = [...(msg.read_by || []), currentUserId];
      const { error } = await supabase
        .from("party_messages")
        .update({ read_by: newReadBy })
        .eq("id", msg.id);

      if (error) {
        console.error("❌ markMessagesAsRead error:", error);
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, read_by: newReadBy } : m)),
        );
      }
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
    currentUserId,
    sendMessage,
    markMessagesAsRead,
    broadcastPlayback,
  };
}
