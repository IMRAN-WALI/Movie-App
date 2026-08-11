# BackEnd/app/supabase_client.py
import os
from supabase import create_client, Client

# Server-side client using the SERVICE ROLE key — bypasses RLS.
# Only ever used inside Flask, never sent to any client app.
_supabase_client: Client | None = None
_supabase_anon_client: Client | None = None


def get_supabase() -> Client:
    """Get Supabase client with SERVICE ROLE key (bypasses RLS)"""
    global _supabase_client
    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise RuntimeError(
                "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
            )
        _supabase_client = create_client(url, key)
    return _supabase_client


def get_supabase_anon() -> Client:
    """Get Supabase client with ANON key (respects RLS)"""
    global _supabase_anon_client
    if _supabase_anon_client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")
        if not url or not key:
            raise RuntimeError(
                "Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars"
            )
        _supabase_anon_client = create_client(url, key)
    return _supabase_anon_client


def get_storage_bucket(bucket_name: str):
    """Get a storage bucket instance"""
    supabase = get_supabase()
    return supabase.storage.from_(bucket_name)


def upload_to_bucket(bucket_name: str, file_path: str, file_content: bytes, content_type: str = None):
    """Upload a file to a storage bucket"""
    supabase = get_supabase()
    
    # Ensure bucket exists
    try:
        supabase.storage.create_bucket(bucket_name, {"public": True})
    except Exception:
        pass  # Bucket already exists
    
    # Upload file
    options = {}
    if content_type:
        options["content-type"] = content_type
    
    response = supabase.storage.from_(bucket_name).upload(
        file_path,
        file_content,
        options
    )
    
    # Get public URL
    public_url = supabase.storage.from_(bucket_name).get_public_url(file_path)
    return public_url


def delete_from_bucket(bucket_name: str, file_path: str):
    """Delete a file from a storage bucket"""
    supabase = get_supabase()
    supabase.storage.from_(bucket_name).remove([file_path])
    return True


def get_public_url(bucket_name: str, file_path: str):
    """Get public URL for a file in a bucket"""
    supabase = get_supabase()
    return supabase.storage.from_(bucket_name).get_public_url(file_path)


# Storage bucket constants
CLIPS_BUCKET = "clips"
MOVIES_BUCKET = "videos"
AVATARS_BUCKET = "avatars"