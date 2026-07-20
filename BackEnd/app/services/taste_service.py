from app.supabase_client import get_supabase


def compute_taste_dna(user_id):
    supabase = get_supabase()

    ratings_resp = (
        supabase.table("ratings")
        .select("rating, movie:movies(genres)")
        .eq("user_id", user_id)
        .execute()
    )
    ratings = ratings_resp.data or []

    genre_weights = {}
    total_weight = 0.0

    for row in ratings:
        movie = row.get("movie") or {}
        genres = movie.get("genres") or []
        # Higher-rated movies count for more of the user's taste signal.
        weight = max(float(row.get("rating") or 0), 0.5) / 10.0
        for genre in genres:
            genre_weights[genre] = genre_weights.get(genre, 0.0) + weight
            total_weight += weight

    genre_percentages = {}
    if total_weight > 0:
        for genre, weight in genre_weights.items():
            genre_percentages[genre] = round(weight / total_weight, 4)

    supabase.table("user_taste_dna").upsert(
        {"user_id": user_id, "genre_percentages": genre_percentages},
        on_conflict="user_id",
    ).execute()

    return {
        "user_id": user_id,
        "genre_percentages": genre_percentages,
        "sample_size": len(ratings),
    }
