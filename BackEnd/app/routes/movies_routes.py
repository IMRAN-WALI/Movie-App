from flask import Blueprint, jsonify
from app.utils.auth_middleware import require_auth
from app.utils.error_handlers import api_error
from app.services.movie_service import fetch_trending_movies

movies_bp = Blueprint("movies", __name__)


@movies_bp.get("/trending")
@require_auth
def trending():
    try:
        movies = fetch_trending_movies()
        return jsonify({"results": movies}), 200
    except Exception as e:
        return api_error(f"Failed to fetch trending movies: {str(e)}", 502)
