import os
from supabase import create_client, Client

# Server-side client using the SERVICE ROLE key — bypasses RLS.
# Only ever used inside Flask, never sent to any client app.
_supabase_client: Client | None = None


def get_supabase() -> Client:
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
