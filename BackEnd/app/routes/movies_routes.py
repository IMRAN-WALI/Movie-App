# BackEnd/app/routes/movies_routes.py
from flask import Blueprint, jsonify, request
from app.utils.auth_middleware import require_auth
from app.utils.error_handlers import api_error
from app.services.movie_service import (
    fetch_trending_movies,
    search_movies,
    get_movie_details,
    get_movie_video_url,
    sync_trending_movies,
    sync_movie_to_supabase
)

movies_bp = Blueprint("movies", __name__)


@movies_bp.get("/trending")
@require_auth
def trending():
    try:
        # Try to sync from TMDB first
        synced = sync_trending_movies()
        if synced:
            return jsonify({"results": synced, "source": "tmdb"}), 200
        
        # Fallback to Supabase
        movies = fetch_trending_movies()
        return jsonify({"results": movies, "source": "supabase"}), 200
    except Exception as e:
        return api_error(f"Failed to fetch trending movies: {str(e)}", 502)

@movies_bp.get("/search")
@require_auth
def search():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"results": []}), 200
    
    try:
        movies = search_movies(query)
        return jsonify({"results": movies}), 200
    except Exception as e:
        return api_error(f"Search failed: {str(e)}", 500)

@movies_bp.get("/<int:movie_id>")
@require_auth
def details(movie_id):
    try:
        # First try Supabase
        movie = get_movie_details(movie_id)
        
        # If not in Supabase, try TMDB
        if not movie:
            movie = sync_movie_to_supabase(movie_id)
        
        if not movie:
            return api_error("Movie not found", 404)
        
        return jsonify(movie), 200
    except Exception as e:
        return api_error(f"Failed to fetch movie: {str(e)}", 500)

@movies_bp.get("/<int:movie_id>/download")
@require_auth
def get_download_url(movie_id):
    try:
        movie = get_movie_video_url(movie_id)
        if not movie:
            return api_error("Movie not found", 404)
        
        if not movie.get("video_url"):
            return api_error("No video available for download", 404)
        
        return jsonify({
            "movie_id": movie_id,
            "video_url": movie["video_url"],
            "title": movie["title"]
        }), 200
    except Exception as e:
        return api_error(f"Failed to get download URL: {str(e)}", 500)

@movies_bp.post("/sync/<int:tmdb_id>")
@require_auth
def sync_movie(tmdb_id):
    try:
        movie = sync_movie_to_supabase(tmdb_id)
        if not movie:
            return api_error("Movie not found on TMDB", 404)
        return jsonify({"message": "Movie synced successfully", "movie": movie}), 200
    except Exception as e:
        return api_error(f"Failed to sync movie: {str(e)}", 500)

@movies_bp.post("/sync-trending")
@require_auth
def sync_trending():
    try:
        results = sync_trending_movies()
        return jsonify({"message": f"Synced {len(results)} movies", "results": results}), 200
    except Exception as e:
        return api_error(f"Failed to sync trending: {str(e)}", 500)