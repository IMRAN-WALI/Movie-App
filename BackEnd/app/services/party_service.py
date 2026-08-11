# BackEnd/app/services/party_service.py
import secrets
import string
import uuid
from datetime import datetime
from app.supabase_client import get_supabase  # ✅ Correct import

def _generate_invite_code(length=6):
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))

def create_party(host_id, movie_id):
    """Create a new watch party"""
    try:
        supabase = get_supabase()  # ✅ Use supabase_client
        
        invite_code = _generate_invite_code()
        party_id = str(uuid.uuid4())
        
        party_data = {
            "id": party_id,
            "host_id": host_id,
            "movie_id": int(movie_id),
            "status": "waiting",
            "invite_code": invite_code,
            "is_active": True,
            "current_time": 0,
            "created_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("watch_parties").insert(party_data).execute()
        party = response.data[0] if response.data else party_data
        
        # Add host as participant
        supabase.table("party_participants").insert({
            "party_id": party["id"],
            "user_id": host_id,
            "is_muted": False
        }).execute()
        
        return party
        
    except Exception as e:
        print(f"❌ create_party error: {e}")
        raise e

def sync_party(party_id, user_id, current_time):
    """Sync party playback position"""
    supabase = get_supabase()
    
    # Check party exists
    party_resp = (
        supabase.table("watch_parties")
        .select("host_id, is_active, movie_id")
        .eq("id", party_id)
        .single()
        .execute()
    )
    
    party = party_resp.data
    if not party:
        raise ValueError("Party not found")
    
    if not party["is_active"]:
        raise ValueError("Party has ended")
    
    # Check if user is a member (unless they're the host)
    if party["host_id"] != user_id:
        member_resp = (
            supabase.table("party_participants")
            .select("id")
            .eq("party_id", party_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        if not member_resp.data:
            raise PermissionError("Not a member of this party")
    
    # Update party current time (this triggers realtime)
    update_resp = (
        supabase.table("watch_parties")
        .update({
            "current_time": float(current_time),
            "updated_at": datetime.utcnow().isoformat()
        })
        .eq("id", party_id)
        .execute()
    )
    
    # Keep user's watch history in sync
    supabase.table("watch_history").update(
        {"progress_seconds": float(current_time)}
    ).eq("user_id", user_id).eq("movie_id", party["movie_id"]).execute()
    
    return update_resp.data[0] if update_resp.data else party

def join_party(party_id, user_id):
    """Join a watch party"""
    supabase = get_supabase()
    
    # Check party exists and is active
    party_resp = (
        supabase.table("watch_parties")
        .select("*")
        .eq("id", party_id)
        .single()
        .execute()
    )
    
    party = party_resp.data
    if not party:
        raise ValueError("Party not found")
    
    if not party.get("is_active", False):
        raise ValueError("Party has ended")
    
    # Check if already a member
    existing = (
        supabase.table("party_participants")
        .select("id")
        .eq("party_id", party_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    
    if existing.data:
        return party  # Already joined
    
    # Add participant
    supabase.table("party_participants").insert(
        {"party_id": party_id, "user_id": user_id, "is_muted": False}
    ).execute()
    
    return party

def leave_party(party_id, user_id):
    """Leave a watch party"""
    supabase = get_supabase()
    
    # Check if user is host
    party_resp = (
        supabase.table("watch_parties")
        .select("host_id")
        .eq("id", party_id)
        .single()
        .execute()
    )
    
    if party_resp.data and party_resp.data.get("host_id") == user_id:
        # Host is leaving - end the party
        supabase.table("watch_parties").update(
            {"is_active": False, "status": "ended"}
        ).eq("id", party_id).execute()
    
    # Remove participant
    supabase.table("party_participants").delete().eq("party_id", party_id).eq("user_id", user_id).execute()
    return True

def get_party_participants(party_id):
    """Get all participants in a party"""
    supabase = get_supabase()
    resp = (
        supabase.table("party_participants")
        .select("*, profiles!inner(display_name, avatar_url)")
        .eq("party_id", party_id)
        .execute()
    )
    return resp.data or []

def get_party_by_invite_code(invite_code):
    """Get party by invite code"""
    supabase = get_supabase()
    resp = (
        supabase.table("watch_parties")
        .select("*")
        .eq("invite_code", invite_code)
        .single()
        .execute()
    )
    return resp.data