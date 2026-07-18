import { supabase } from "../lib/supabase";

function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createWatchParty(movieId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const inviteCode = generateInviteCode();
  const roomName = `party-${inviteCode.toLowerCase()}`;

  const { data: party, error } = await supabase
    .from("watch_parties")
    .insert({
      host_id: user.id,
      movie_id: movieId,
      invite_code: inviteCode,
      livekit_room_name: roomName,
      status: "waiting",
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("watch_party_participants").insert({
    party_id: party.id,
    user_id: user.id,
  });

  return party;
}

export async function joinWatchParty(inviteCode) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: party, error } = await supabase
    .from("watch_parties")
    .select("*")
    .eq("invite_code", inviteCode.toUpperCase())
    .single();

  if (error || !party) throw new Error("Party not found");
  if (party.status === "ended") throw new Error("This party has ended");

  const { error: joinError } = await supabase
    .from("watch_party_participants")
    .upsert(
      { party_id: party.id, user_id: user.id, left_at: null },
      { onConflict: "party_id,user_id" },
    );

  if (joinError) throw joinError;

  return party;
}

export async function leaveWatchParty(partyId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("watch_party_participants")
    .update({ left_at: new Date().toISOString() })
    .eq("party_id", partyId)
    .eq("user_id", user.id);
}

export async function updatePlaybackState(partyId, status, positionSeconds) {
  const { error } = await supabase
    .from("watch_parties")
    .update({
      status,
      playback_position_seconds: positionSeconds,
      playback_updated_at: new Date().toISOString(),
    })
    .eq("id", partyId);

  if (error) throw error;
}

export async function sendPartyMessage(partyId, body) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("watch_party_messages").insert({
    party_id: partyId,
    user_id: user.id,
    body,
  });

  if (error) throw error;
}

export async function fetchPartyMessages(partyId) {
  const { data, error } = await supabase
    .from("watch_party_messages")
    .select("*")
    .eq("party_id", partyId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) throw error;
  return data;
}

export async function fetchPartyParticipants(partyId) {
  const { data, error } = await supabase
    .from("watch_party_participants")
    .select("*")
    .eq("party_id", partyId)
    .is("left_at", null);

  if (error) throw error;
  return data;
}

export async function setMuted(partyId, isMuted) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("watch_party_participants")
    .update({ is_muted: isMuted })
    .eq("party_id", partyId)
    .eq("user_id", user.id);
}
