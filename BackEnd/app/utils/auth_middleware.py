# BackEnd/app/utils/auth_middleware.py
import os
from functools import wraps
from flask import request, jsonify, g
from supabase import create_client, Client

_anon_client: Client | None = None

def _get_anon_client() -> Client:
    global _anon_client
    if _anon_client is None:
        url = os.getenv("SUPABASE_URL")
        anon_key = os.getenv("SUPABASE_ANON_KEY")
        if not url or not anon_key:
            raise RuntimeError("Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars")
        _anon_client = create_client(url, anon_key)
    return _anon_client

def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or malformed Authorization header"}), 401

        token = auth_header.split(" ", 1)[1].strip()
        if not token:
            return jsonify({"error": "Missing bearer token"}), 401

        try:
            client = _get_anon_client()
            response = client.auth.get_user(token)
            user = response.user if hasattr(response, "user") else None
            if not user:
                return jsonify({"error": "Invalid or expired token"}), 401
        except Exception as e:
            print(f"❌ Auth error: {e}")
            return jsonify({"error": "Invalid or expired token"}), 401

        g.user_id = user.id
        g.user = user
        g.token = token
        return fn(*args, **kwargs)

    return wrapper