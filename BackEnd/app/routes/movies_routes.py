# BackEnd/app/routes/movies_routes.py

from flask import Blueprint, jsonify, request

from app.utils.auth_middleware import require_auth
from app.utils.error_handlers import api_error

from app.services.movie_service import (
    fetch_trending_movies,
    search_movies,
    get_movie_details,
    get_movie_video_url,
    get_movie_download_manifest,
    import_movie_from_url,
    sync_trending_movies,
    sync_movie_to_supabase
)


@movies_bp.post("/<int:movie_id>/import-full-movie")
@require_auth
def import_full_movie(movie_id):

    try:

        body = request.get_json() or {}

        source_url = body.get(
            "source_url"
        )

        file_name = body.get(
            "file_name"
        ) or f"{movie_id}.mp4"

        if not source_url:

            return api_error(
                "source_url is required",
                400
            )

        result = import_movie_from_url(
            movie_id=movie_id,
            source_url=source_url,
            file_name=file_name
        )

        return jsonify({
            "message":
                "Full movie imported successfully",
            "result": result
        }), 200

    except Exception as e:

        print(
            f"❌ Full movie import error "
            f"{movie_id}:",
            e
        )

        return api_error(
            f"Failed to import full movie: {str(e)}",
            500
        )


movies_bp = Blueprint(
    "movies",
    __name__
)


# ============================================================
# TRENDING
# ============================================================

@movies_bp.get("/trending")
@require_auth
def trending():

    try:

        # Try TMDB first
        synced = sync_trending_movies()

        if synced:

            return jsonify({
                "results": synced,
                "source": "tmdb"
            }), 200

        # Fallback to Supabase
        movies = fetch_trending_movies()

        return jsonify({
            "results": movies,
            "source": "supabase"
        }), 200

    except Exception as e:

        print(
            f"❌ Trending error: {e}"
        )

        return api_error(
            "Failed to fetch trending movies",
            502
        )


# ============================================================
# SEARCH
# ============================================================

@movies_bp.get("/search")
@require_auth
def search():

    query = request.args.get(
        "q",
        ""
    ).strip()

    if not query:

        return jsonify({
            "results": []
        }), 200

    try:

        movies = search_movies(
            query
        )

        return jsonify({
            "results": movies
        }), 200

    except Exception as e:

        print(
            f"❌ Search error: {e}"
        )

        return api_error(
            "Search failed",
            500
        )


# ============================================================
# MOVIE DETAILS
# ============================================================

@movies_bp.get("/<int:movie_id>")
@require_auth
def details(movie_id):

    try:

        # First check Supabase
        movie = get_movie_details(
            movie_id
        )

        # If not found, sync from TMDB
        if not movie:

            movie = sync_movie_to_supabase(
                movie_id
            )

        if not movie:

            return api_error(
                "Movie not found",
                404
            )

        return jsonify(
            movie
        ), 200

    except Exception as e:

        print(
            f"❌ Movie details error "
            f"for {movie_id}: {e}"
        )

        return api_error(
            "Failed to fetch movie",
            500
        )


# ============================================================
# FULL MOVIE DOWNLOAD
# ============================================================

@movies_bp.get("/<int:movie_id>/download")
@require_auth
def get_download_url(movie_id):

    try:

        manifest = get_movie_download_manifest(movie_id)

        if not manifest:

            return api_error(
                "Full movie chunks are not available",
                404
            )

        if manifest.get("video_type") != "full_movie":

            return api_error(
                "This file is not a full movie",
                400
            )

        return jsonify({
            "movie_id": manifest["movie_id"],
            "title": manifest["title"],
            "file_name": manifest["file_name"],
            "file_size": manifest["file_size"],
            "chunk_size": manifest["chunk_size"],
            "chunk_count": manifest["chunk_count"],
            "video_type": "full_movie",
            "chunks": manifest["chunks"]
        }), 200

    except Exception as e:

        print(
            f"❌ Download manifest error "
            f"for movie {movie_id}:",
            e
        )

        return api_error(
            "Failed to create movie download manifest",
            500
        )

    try:

        print(
            f"⬇️ Download request for movie: "
            f"{movie_id}"
        )

        movie = get_movie_video_url(
            movie_id
        )

        # ----------------------------------------------------
        # No movie / no storage file
        # ----------------------------------------------------

        if not movie:

            return api_error(
                "Full movie is not available for download",
                404
            )

        # ----------------------------------------------------
        # Safety check
        # ----------------------------------------------------

        if (
            movie.get(
                "video_type"
            )
            != "full_movie"
        ):

            return api_error(
                "This file is not a full movie",
                400
            )

        # ----------------------------------------------------
        # URL check
        # ----------------------------------------------------

        if not movie.get(
            "video_url"
        ):

            return api_error(
                "No full movie file available",
                404
            )

        print(
            f"✅ Full movie URL ready: "
            f"{movie['title']}"
        )

        return jsonify({
            "movie_id": movie["id"],
            "title": movie["title"],
            "video_url": movie["video_url"],
            "video_type": "full_movie"
        }), 200

    except Exception as e:

        print(
            f"❌ Download URL error "
            f"for movie {movie_id}: {e}"
        )

        return api_error(
            "Failed to get full movie download URL",
            500
        )


# ============================================================
# SYNC SINGLE MOVIE
# ============================================================

@movies_bp.post("/sync/<int:tmdb_id>")
@require_auth
def sync_movie(tmdb_id):

    try:

        movie = sync_movie_to_supabase(
            tmdb_id
        )

        if not movie:

            return api_error(
                "Movie not found on TMDB",
                404
            )

        return jsonify({
            "message": "Movie synced successfully",
            "movie": movie
        }), 200

    except Exception as e:

        print(
            f"❌ Movie sync error: {e}"
        )

        return api_error(
            "Failed to sync movie",
            500
        )


# ============================================================
# SYNC TRENDING MOVIES
# ============================================================

@movies_bp.post("/sync-trending")
@require_auth
def sync_trending():

    try:

        results = sync_trending_movies()

        return jsonify({
            "message": (
                f"Synced {len(results)} movies"
            ),
            "results": results
        }), 200

    except Exception as e:

        print(
            f"❌ Trending sync error: {e}"
        )

        return api_error(
            "Failed to sync movie",
            500
        )