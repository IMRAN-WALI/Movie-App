import os
from functools import lru_cache
import numpy as np
from sentence_transformers import SentenceTransformer
from app.supabase_client import get_supabase

_MODEL_NAME = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")


@lru_cache(maxsize=1)
def _get_model():
    # Loaded once per worker process; weights are cached to disk by
    # sentence-transformers after the first download.
    return SentenceTransformer(_MODEL_NAME)


def _movie_text(movie):
    genres = ", ".join(movie.get("genres") or [])
    title = movie.get("title") or ""
    overview = movie.get("overview") or ""
    return f"{title}. Genres: {genres}. {overview}".strip()


def recommend_movies(user_id, top_n=10):
    supabase = get_supabase()
    model = _get_model()

    ratings_resp = (
        supabase.table("ratings")
        .select("rating, movie_id, movie:movies(id, title, overview, genres)")
        .eq("user_id", user_id)
        .execute()
    )
    ratings = [r for r in (ratings_resp.data or []) if r.get("movie")]

    if not ratings:
        # Cold start — no ratings yet, fall back to the general catalog.
        fallback = (
            supabase.table("movies")
            .select("id, title, overview, genres, poster_url")
            .limit(top_n)
            .execute()
        )
        return fallback.data or []

    rated_movie_ids = [r["movie_id"] for r in ratings]
    texts = [_movie_text(r["movie"]) for r in ratings]
    weights = np.array([max(float(r.get("rating") or 0), 0.5) for r in ratings])

    # User taste vector = rating-weighted average of embeddings of movies
    # they've already rated.
    rated_embeddings = model.encode(texts, normalize_embeddings=True)
    weights = weights / weights.sum()
    user_vector = np.average(rated_embeddings, axis=0, weights=weights)

    # Candidate pool: everything not yet rated by this user.
    catalog_resp = (
        supabase.table("movies")
        .select("id, title, overview, genres, poster_url")
        .not_.in_("id", rated_movie_ids)
        .limit(300)
        .execute()
    )
    candidates = catalog_resp.data or []
    if not candidates:
        return []

    candidate_texts = [_movie_text(c) for c in candidates]
    candidate_embeddings = model.encode(candidate_texts, normalize_embeddings=True)

    # Embeddings are normalized, so dot product == cosine similarity.
    scores = candidate_embeddings @ user_vector
    ranked_indices = np.argsort(-scores)[:top_n]

    recommendations = []
    for idx in ranked_indices:
        movie = dict(candidates[idx])
        movie["match_score"] = round(float(scores[idx]), 4)
        recommendations.append(movie)

    return recommendations
