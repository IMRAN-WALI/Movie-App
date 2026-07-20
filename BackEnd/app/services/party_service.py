import secrets
import string
from app.supabase_client import get_supabase


def _generate_invite_code(length=6):
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def create_party(host_id, movie_id):
    supabase = get_supabase()
    invite_code = _generate_invite_code()

    resp = (
        supabase.table("watch_parties")
        .insert(
            {
                "host_id": host_id,
                "movie_id": movie_id,
                "is_active": True,
                "current_time": 0,
                "invite_code": invite_code,
            }
        )
        .execute()
    )
    party = resp.data[0]

    # Host auto-joins as the first party member.
    supabase.table("party_members").insert(
        {"party_id": party["id"], "user_id": host_id, "is_talking": False}
    ).execute()

    return party


def sync_party(party_id, user_id, current_time):
    supabase = get_supabase()

    party_resp = (
        supabase.table("watch_parties")
        .select("host_id, is_active")
        .eq("id", party_id)
        .single()
        .execute()
    )
    party = party_resp.data
    if not party:
        raise ValueError("Party not found")
    if not party["is_active"]:
        raise ValueError("Party has ended")

    if party["host_id"] != user_id:
        member_resp = (
            supabase.table("party_members")
            .select("id")
            .eq("party_id", party_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        if not member_resp.data:
            raise PermissionError("Not a member of this party")

    # This update is what Supabase Realtime broadcasts to every subscribed
    # React Native client (watch_parties is in the supabase_realtime publication).
    update_resp = (
        supabase.table("watch_parties")
        .update({"current_time": current_time})
        .eq("id", party_id)
        .execute()
    )

    return update_resp.data[0]
