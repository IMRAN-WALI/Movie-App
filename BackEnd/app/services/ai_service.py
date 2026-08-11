# BackEnd/app/services/ai_service.py
import os
from functools import lru_cache
import numpy as np
from sentence_transformers import SentenceTransformer
from app.supabase_client import get_supabase  # ✅ Correct import

_MODEL_NAME = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

@lru_cache(maxsize=1)
def _get_model():
    return SentenceTransformer(_MODEL_NAME)

def _movie_text(movie):
    genres = ", ".join(movie.get("genres") or [])
    title = movie.get("title") or ""
    overview = movie.get("overview") or ""
    return f"{title}. Genres: {genres}. {overview}".strip()

def recommend_movies(user_id, top_n=10):
    """Get AI movie recommendations"""
    try:
        supabase = get_supabase()  # ✅ Use supabase_client
        model = _get_model()
        
        # Get user's ratings
        ratings_resp = (
            supabase.table("ratings")
            .select("rating, movie_id, movie:movies(id, title, overview, genres)")
            .eq("user_id", user_id)
            .execute()
        )
        
        ratings = [r for r in (ratings_resp.data or []) if r.get("movie")]
        
        if not ratings:
            fallback = (
                supabase.table("movies")
                .select("id, title, overview, genres, poster_url")
                .order("vote_average", desc=True)
                .limit(top_n)
                .execute()
            )
            return fallback.data or []
        
        # ... rest of the AI logic
        
    except Exception as e:
        print(f"❌ recommend_movies error: {e}")
        return []

def get_ai_recommendations_with_tmdb(user_id, top_n=10):
    """Get AI recommendations with TMDB fallback"""
    try:
        # Try AI recommendations first
        results = recommend_movies(user_id, top_n)
        if results:
            return results
        
        # Fallback to TMDB trending
        from app.services.movie_service import get_tmdb_trending
        return get_tmdb_trending()[:top_n]
    except Exception as e:
        print(f"❌ AI recommendations error: {e}")
        return []