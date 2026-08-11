# BackEnd/app/services/__init__.py
from app.services.ai_service import recommend_movies, get_ai_recommendations_with_tmdb
from app.services.clip_service import upload_clip, get_user_clips, delete_clip, get_clip_feed, toggle_like
from app.services.movie_service import (
    fetch_trending_movies,
    search_movies,
    get_movie_details,
    get_movie_video_url,
    update_movie_video_url,
    sync_movie_to_supabase,
    sync_trending_movies,
    get_tmdb_trending,
    search_tmdb_movies,
    get_tmdb_movie_details
)
from app.services.party_service import (
    create_party,
    sync_party,
    join_party,
    leave_party,
    get_party_participants,
    get_party_by_invite_code
)
from app.services.taste_service import (
    compute_taste_dna,
    get_taste_dna,
    get_user_ratings,
    get_user_watch_history
)

__all__ = [
    # AI
    'recommend_movies',
    'get_ai_recommendations_with_tmdb',
    
    # Clips
    'upload_clip',
    'get_user_clips',
    'delete_clip',
    'get_clip_feed',
    'toggle_like',
    
    # Movies
    'fetch_trending_movies',
    'search_movies',
    'get_movie_details',
    'get_movie_video_url',
    'update_movie_video_url',
    'sync_movie_to_supabase',
    'sync_trending_movies',
    'get_tmdb_trending',
    'search_tmdb_movies',
    'get_tmdb_movie_details',
    
    # Party
    'create_party',
    'sync_party',
    'join_party',
    'leave_party',
    'get_party_participants',
    'get_party_by_invite_code',
    
    # Taste
    'compute_taste_dna',
    'get_taste_dna',
    'get_user_ratings',
    'get_user_watch_history'
]