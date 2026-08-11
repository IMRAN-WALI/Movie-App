# BackEnd/app/services/taste_service.py
from app.supabase_client import get_supabase  # ✅ Correct import

def compute_taste_dna(user_id):
    """Compute taste DNA for a user"""
    try:
        supabase = get_supabase()  # ✅ Use supabase_client
        
        # Get user's ratings
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
            weight = max(float(row.get("rating") or 0), 0.5) / 10.0
            
            for genre in genres:
                genre_weights[genre] = genre_weights.get(genre, 0.0) + weight
                total_weight += weight
        
        genre_percentages = {}
        if total_weight > 0:
            for genre, weight in genre_weights.items():
                genre_percentages[genre] = round(weight / total_weight, 4)
        
        # Save to database
        supabase.table("taste_profiles").upsert(
            {
                "user_id": user_id,
                "genre_breakdown": genre_percentages,
                "total_ratings": len(ratings),
                "updated_at": datetime.utcnow().isoformat()
            },
            on_conflict="user_id"
        ).execute()
        
        return {
            "user_id": user_id,
            "genre_percentages": genre_percentages,
            "sample_size": len(ratings)
        }
        
    except Exception as e:
        print(f"❌ compute_taste_dna error: {e}")
        return {"user_id": user_id, "error": str(e)}

def get_taste_dna(user_id):
    """Get existing taste DNA for a user"""
    supabase = get_supabase()
    resp = (
        supabase.table("taste_profiles")
        .select("*")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    return resp.data

def get_user_ratings(user_id):
    """Get all ratings by a user"""
    supabase = get_supabase()
    resp = (
        supabase.table("ratings")
        .select("*, movies!inner(title, poster_url, genres)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data or []

def get_user_watch_history(user_id):
    """Get user's watch history"""
    supabase = get_supabase()
    resp = (
        supabase.table("watch_history")
        .select("*, movies!inner(title, poster_url)")
        .eq("user_id", user_id)
        .order("watched_at", desc=True)
        .execute()
    )
    return resp.data or []