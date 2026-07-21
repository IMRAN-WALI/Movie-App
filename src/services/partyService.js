import { supabase } from "../lib/supabase";

export async function createWatchParty(movieId) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("You must be logged in");
    }

    console.log("👤 Creating party for user:", user.id);
    console.log("🎬 Movie ID:", movieId);

    const inviteCode = generateInviteCode();
    const roomName = `party_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Create party
    const { data: party, error: partyError } = await supabase
      .from("watch_parties")
      .insert({
        movie_id: parseInt(movieId),
        host_id: user.id,
        status: "waiting",
        invite_code: inviteCode,
        livekit_room_name: roomName,
      })
      .select()
      .single();

    if (partyError) {
      console.error("❌ Supabase insert error:", partyError);
      throw partyError;
    }

    console.log("✅ Party created:", party);

    // Add host as participant
    const { error: participantError } = await supabase
      .from("party_participants")
      .insert({
        party_id: party.id,
        user_id: user.id,
        is_muted: false,
      });

    if (participantError) {
      console.error("❌ Error adding host as participant:", participantError);
      // Don't throw, party already created
    } else {
      console.log("✅ Host added as participant");
    }

    return party;
  } catch (error) {
    console.error("❌ createWatchParty error:", error);
    throw error;
  }
}
export async function joinWatchParty(inviteCode) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("You must be logged in");
    }

    console.log("🔍 Looking for party with code:", inviteCode);

    const { data: party, error: findError } = await supabase
      .from("watch_parties")
      .select("*")
      .eq("invite_code", inviteCode)
      .eq("status", "waiting")
      .single();

    if (findError || !party) {
      console.error("❌ Party not found:", findError);
      throw new Error("Invalid or expired invite code");
    }

    console.log("✅ Party found:", party);

    const { error: joinError } = await supabase
      .from("party_participants")
      .insert({
        party_id: party.id,
        user_id: user.id,
      });

    if (joinError) {
      console.error("❌ Join error:", joinError);
      throw joinError;
    }

    return party;
  } catch (error) {
    console.error("❌ joinWatchParty error:", error);
    throw error;
  }
}

export async function leaveWatchParty(sessionId) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("You must be logged in");
    }

    const { error } = await supabase
      .from("party_participants")
      .delete()
      .eq("party_id", sessionId)
      .eq("user_id", user.id);

    if (error) {
      console.error("❌ Leave error:", error);
      throw error;
    }

    console.log("✅ Left party");
  } catch (error) {
    console.error("❌ leaveWatchParty error:", error);
    throw error;
  }
}

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
