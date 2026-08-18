import os
import sys
import io  # ✅ IMPORT ADD KAREIN
import requests

from flask import Flask, jsonify, request, Response, stream_with_context
from flask_cors import CORS
from supabase import create_client
from dotenv import load_dotenv

# ✅ Force UTF-8 encoding - Windows ke liye
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from app.utils.auth_middleware import require_auth

load_dotenv()


def create_app():
    app = Flask(__name__)
    CORS(app)

    # ============================================================
    # CONFIG
    # ============================================================

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    tmdb_api_key = os.getenv("TMDB_API_KEY")

    if not supabase_url or not supabase_key:
        print("❌ ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing")
        return app

    supabase = create_client(
        supabase_url,
        supabase_key,
    )

    if not tmdb_api_key:
        print("⚠️ TMDB_API_KEY missing")

    # ============================================================
    # AUTO SEED
    # ============================================================

    def fetch_and_seed_movies():
        """TMDB se movies fetch karke Supabase mein insert kare."""

        if not tmdb_api_key:
            print("❌ TMDB_API_KEY missing, can't seed")
            return

        try:
            result = (
                supabase
                .table("movies")
                .select("id", count="exact")
                .limit(1)
                .execute()
            )

            if result.data and len(result.data) > 0:
                print("✅ Movies already exist in database")
                return

            print("📡 Fetching movies from TMDB...")

            url = (
                "https://api.themoviedb.org/3/movie/popular"
                f"?api_key={tmdb_api_key}"
                "&language=en-US"
                "&page=1"
            )

            response = requests.get(
                url,
                timeout=20,
            )

            response.raise_for_status()

            data = response.json()

            if "results" not in data:
                print("❌ Failed to fetch TMDB movies")
                return

            movies = []

            for movie in data["results"]:
                movies.append(
                    {
                        "id": movie["id"],
                        "title": movie["title"],
                        "overview": movie.get("overview", ""),
                        "poster_url": (
                            f"https://image.tmdb.org/t/p/w500"
                            f"{movie.get('poster_path', '')}"
                            if movie.get("poster_path")
                            else ""
                        ),
                        "backdrop_url": (
                            f"https://image.tmdb.org/t/p/w1280"
                            f"{movie.get('backdrop_path', '')}"
                            if movie.get("backdrop_path")
                            else ""
                        ),
                        "release_date": movie.get("release_date", ""),
                        "vote_average": movie.get("vote_average", 0),
                        "vote_count": movie.get("vote_count", 0),
                        "popularity": movie.get("popularity", 0),
                        "genres": [],
                        "runtime": None,
                        "video_url": None,
                    }
                )

            supabase.table("movies").insert(movies).execute()

            print(
                f"✅ {len(movies)} movies inserted from TMDB!"
            )

        except Exception as e:
            print(f"❌ Seed failed: {e}")

    # ============================================================
    # HOME
    # ============================================================

    @app.route("/")
    def home():
        return jsonify(
            {
                "message": "🎬 Movie App Backend is running!",
                "version": "2.0.0",
                "download_system": "chunked-full-movie",
            }
        )

    # ============================================================
    # HEALTH
    # ============================================================

    @app.route("/health")
    def health():
        return jsonify(
            {
                "status": "ok",
                "message": "Server is running",
            }
        ), 200

    # ============================================================
    # SEED
    # ============================================================

    @app.route(
        "/api/movies/seed",
        methods=["GET"],
    )
    def seed_route():

        try:
            fetch_and_seed_movies()

            return jsonify(
                {
                    "message": "✅ Movies seeded successfully!"
                }
            )

        except Exception as e:

            return jsonify(
                {
                    "error": str(e)
                }
            ), 500

    # ============================================================
    # TRENDING
    # ============================================================

    @app.route(
        "/api/movies/trending",
        methods=["GET"],
    )
    def get_trending_movies():

        try:

            result = (
                supabase
                .table("movies")
                .select("*")
                .order(
                    "popularity",
                    desc=True,
                )
                .limit(20)
                .execute()
            )

            return jsonify(
                {
                    "results": result.data,
                    "source": "supabase",
                }
            )

        except Exception as e:

            return jsonify(
                {
                    "error": str(e)
                }
            ), 500

    # ============================================================
    # SEARCH
    # ============================================================

    @app.route(
        "/api/movies/search",
        methods=["GET"],
    )
    def search_movies():

        query = request.args.get(
            "q",
            "",
        ).strip()

        if not query:

            return jsonify(
                {
                    "results": []
                }
            ), 200

        try:

            result = (
                supabase
                .table("movies")
                .select("*")
                .ilike(
                    "title",
                    f"%{query}%",
                )
                .order(
                    "popularity",
                    desc=True,
                )
                .limit(30)
                .execute()
            )

            return jsonify(
                {
                    "results": result.data,
                    "source": "supabase",
                }
            )

        except Exception as e:

            return jsonify(
                {
                    "error": str(e)
                }
            ), 500

    # ============================================================
    # NEARBY
    # ============================================================

    @app.route(
        "/api/movies/nearby",
        methods=["GET"],
    )
    def get_nearby_movies():

        city = request.args.get(
            "city",
            "",
        ).strip()

        try:

            if city:

                result = (
                    supabase
                    .table("movies")
                    .select("*")
                    .ilike(
                        "title",
                        f"%{city}%",
                    )
                    .limit(20)
                    .execute()
                )

            else:

                result = (
                    supabase
                    .table("movies")
                    .select("*")
                    .limit(20)
                    .execute()
                )

            return jsonify(
                {
                    "results": result.data
                }
            )

        except Exception as e:

            return jsonify(
                {
                    "error": str(e)
                }
            ), 500

    # ============================================================
    # MOVIE DETAILS
    # ============================================================

    @app.route(
        "/api/movies/<int:movie_id>",
        methods=["GET"],
    )
    def get_movie_details(movie_id):

        try:

            result = (
                supabase
                .table("movies")
                .select("*")
                .eq(
                    "id",
                    movie_id,
                )
                .single()
                .execute()
            )

            if result.data:

                return jsonify(
                    result.data
                )

            # ----------------------------------------------------
            # TMDB FALLBACK
            # ----------------------------------------------------

            if tmdb_api_key:

                url = (
                    f"https://api.themoviedb.org/3/movie/"
                    f"{movie_id}"
                )

                params = {
                    "api_key": tmdb_api_key,
                    "language": "en-US",
                    "append_to_response": "credits",
                }

                response = requests.get(
                    url,
                    params=params,
                    timeout=20,
                )

                if response.status_code == 200:

                    data = response.json()

                    movie_data = {
                        "id": data["id"],
                        "title": data["title"],
                        "overview": data.get(
                            "overview",
                            "",
                        ),
                        "poster_url": (
                            f"https://image.tmdb.org/t/p/w500"
                            f"{data.get('poster_path', '')}"
                            if data.get("poster_path")
                            else ""
                        ),
                        "backdrop_url": (
                            f"https://image.tmdb.org/t/p/w1280"
                            f"{data.get('backdrop_path', '')}"
                            if data.get("backdrop_path")
                            else ""
                        ),
                        "release_date": data.get(
                            "release_date",
                            "",
                        ),
                        "vote_average": data.get(
                            "vote_average",
                            0,
                        ),
                        "vote_count": data.get(
                            "vote_count",
                            0,
                        ),
                        "runtime": data.get(
                            "runtime"
                        ),
                        "genres": [
                            g["name"]
                            for g in data.get(
                                "genres",
                                [],
                            )
                        ],
                        "tagline": data.get(
                            "tagline",
                            "",
                        ),
                        "status": data.get(
                            "status",
                            "",
                        ),
                        "video_url": None,
                    }

                    return jsonify(
                        movie_data
                    )

            return jsonify(
                {
                    "error": "Movie not found"
                }
            ), 404

        except Exception as e:

            print(
                f"❌ Movie details error: {e}"
            )

            return jsonify(
                {
                    "error": str(e)
                }
            ), 500

    # ============================================================
    # HELPER: SIGNED URL
    # ============================================================

    def create_storage_signed_url(
        storage_path,
        expires_in=3600,
    ):
        """
        Supabase Storage se temporary signed URL.
        """

        response = (
            supabase
            .storage
            .from_("full-movies")
            .create_signed_url(
                storage_path,
                expires_in,
            )
        )

        signed_url = None

        if isinstance(response, dict):

            signed_url = (
                response.get("signedURL")
                or response.get("signedUrl")
                or response.get("signed_url")
            )

            data = response.get("data")

            if isinstance(data, dict):

                signed_url = (
                    signed_url
                    or data.get("signedURL")
                    or data.get("signedUrl")
                    or data.get("signed_url")
                )

        if not signed_url:

            raise RuntimeError(
                f"Could not create signed URL for {storage_path}"
            )

        return signed_url

    # ============================================================
    # GET CHUNKS
    # ============================================================

    def get_movie_chunks(movie_id):

        result = (
            supabase
            .table("movie_chunks")
            .select("*")
            .eq(
                "movie_id",
                movie_id,
            )
            .order(
                "chunk_index",
                desc=False,
            )
            .execute()
        )

        chunks = result.data or []

        return chunks

    # ============================================================
    # FULL MOVIE DOWNLOAD
    # ============================================================

    @app.route(
        "/api/movies/<int:movie_id>/download",
        methods=["GET"],
    )
    @require_auth
    def download_full_movie(movie_id):

        try:

            print(
                f"📥 FULL MOVIE DOWNLOAD REQUEST: {movie_id}"
            )

            # ----------------------------------------------------
            # MOVIE
            # ----------------------------------------------------

            movie_result = (
                supabase
                .table("movies")
                .select(
                    "id, title, video_type, downloadable, "
                    "chunk_count, chunk_size"
                )
                .eq(
                    "id",
                    movie_id,
                )
                .single()
                .execute()
            )

            movie = movie_result.data

            if not movie:

                return jsonify(
                    {
                        "error": "Movie not found"
                    }
                ), 404

            # ----------------------------------------------------
            # MUST BE FULL MOVIE
            # ----------------------------------------------------

            if movie.get("video_type") != "full_movie":

                return jsonify(
                    {
                        "error": (
                            "This movie is not marked as "
                            "a full movie"
                        )
                    }
                ), 400

            # ----------------------------------------------------
            # DOWNLOAD ENABLED
            # ----------------------------------------------------

            if movie.get("downloadable") is not True:

                return jsonify(
                    {
                        "error": (
                            "Download is not enabled for "
                            "this movie"
                        )
                    }
                ), 403

            # ----------------------------------------------------
            # GET CHUNKS
            # ----------------------------------------------------

            chunks = get_movie_chunks(
                movie_id
            )

            if not chunks:

                return jsonify(
                    {
                        "error": (
                            "No movie chunks found. "
                            "Upload the full movie chunks first."
                        )
                    }
                ), 404

            # ----------------------------------------------------
            # SORT AGAIN FOR SAFETY
            # ----------------------------------------------------

            chunks.sort(
                key=lambda item: int(
                    item.get(
                        "chunk_index",
                        0,
                    )
                )
            )

            expected_count = movie.get(
                "chunk_count"
            )

            if expected_count:

                if len(chunks) != int(
                    expected_count
                ):

                    return jsonify(
                        {
                            "error": "Movie chunks are incomplete",
                            "expected_chunks": int(
                                expected_count
                            ),
                            "found_chunks": len(
                                chunks
                            ),
                        }
                    ), 409

            # ----------------------------------------------------
            # CALCULATE TOTAL SIZE
            # ----------------------------------------------------

            total_size = 0

            for chunk in chunks:

                size = chunk.get(
                    "size",
                    0,
                )

                if size is not None:

                    total_size += int(
                        size
                    )

            print(
                f"🎬 Movie: {movie.get('title')}"
            )

            print(
                f"🧩 Chunks: {len(chunks)}"
            )

            print(
                f"💾 Total size: "
                f"{total_size / 1024 / 1024:.2f} MB"
            )

            # ----------------------------------------------------
            # STREAM GENERATOR
            # ----------------------------------------------------

            def generate():

                for position, chunk in enumerate(
                    chunks
                ):

                    storage_path = chunk.get(
                        "storage_path"
                    )

                    if not storage_path:

                        raise RuntimeError(
                            f"Chunk {position} has no storage_path"
                        )

                    print(
                        f"📦 Streaming chunk "
                        f"{position + 1}/{len(chunks)}: "
                        f"{storage_path}"
                    )

                    signed_url = (
                        create_storage_signed_url(
                            storage_path,
                            3600,
                        )
                    )

                    upstream = requests.get(
                        signed_url,
                        stream=True,
                        timeout=60,
                    )

                    if upstream.status_code != 200:

                        upstream.close()

                        raise RuntimeError(
                            f"Could not download storage "
                            f"chunk: HTTP "
                            f"{upstream.status_code}"
                        )

                    try:

                        for data in upstream.iter_content(
                            chunk_size=1024 * 1024
                        ):

                            if data:

                                yield data

                    finally:

                        upstream.close()

                print(
                    "🎉 FULL MOVIE STREAM FINISHED"
                )

            # ----------------------------------------------------
            # RESPONSE
            # ----------------------------------------------------

            safe_title = (
                movie.get(
                    "title",
                    f"movie_{movie_id}",
                )
                .replace(
                    '"',
                    "",
                )
                .replace(
                    "\n",
                    " ",
                )
            )

            response = Response(
                stream_with_context(
                    generate()
                ),
                status=200,
                mimetype="video/mp4",
            )

            response.headers[
                "Content-Length"
            ] = str(total_size)

            response.headers[
                "Content-Disposition"
            ] = (
                f'attachment; filename="{safe_title}.mp4"'
            )

            response.headers[
                "Accept-Ranges"
            ] = "bytes"

            response.headers[
                "Cache-Control"
            ] = "no-cache"

            return response

        except Exception as e:

            print(
                "❌ FULL MOVIE DOWNLOAD ERROR:",
                e,
            )

            return jsonify(
                {
                    "error": (
                        "Failed to stream full movie"
                    ),
                    "details": str(e),
                }
            ), 500

    # ============================================================
    # AUTO SEED
    # ============================================================

    with app.app_context():
        fetch_and_seed_movies()

    return app