import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import create_client
import requests
from dotenv import load_dotenv

load_dotenv()


def create_app():
    app = Flask(__name__)
    CORS(app)

    # ---------- CONFIG ----------
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    tmdb_api_key = os.getenv("TMDB_API_KEY")

    if not supabase_url or not supabase_key:
        print("❌ ERROR: SUPABASE_URL or SUPABASE_KEY missing in .env")
        return app

    supabase = create_client(supabase_url, supabase_key)

    if not tmdb_api_key:
        print("❌ ERROR: TMDB_API_KEY missing in .env")

    # ---------- AUTO-SEED FUNCTION ----------
    def fetch_and_seed_movies():
        """TMDB se movies fetch karein aur database mein insert karein"""
        if not tmdb_api_key:
            print("❌ TMDB_API_KEY missing, can't seed")
            return

        try:
            # Check if movies already exist
            result = (
                supabase.table("movies").select("id", count="exact").limit(1).execute()
            )
            if len(result.data) > 0:
                print("✅ Movies already exist in database")
                return

            print("📡 Fetching movies from TMDB...")
            url = f"https://api.themoviedb.org/3/movie/popular?api_key={tmdb_api_key}&language=en-US&page=1"
            response = requests.get(url)
            data = response.json()

            if "results" not in data:
                print("❌ Failed to fetch from TMDB")
                return

            movies = []
            for movie in data["results"]:
                movies.append(
                    {
                        "id": movie["id"],
                        "title": movie["title"],
                        "overview": movie.get("overview", ""),
                        "poster_path": movie.get("poster_path", ""),
                        "release_date": movie.get("release_date", ""),
                        "vote_average": movie.get("vote_average", 0),
                        "vote_count": movie.get("vote_count", 0),
                        "popularity": movie.get("popularity", 0),
                        "genre_ids": movie.get("genre_ids", []),
                    }
                )

            result = supabase.table("movies").insert(movies).execute()
            print(f"✅ {len(movies)} movies inserted from TMDB!")

        except Exception as e:
            print(f"❌ Seed failed: {e}")

    # ---------- ROUTES ----------

    @app.route("/")
    def home():
        return jsonify({"message": "🎬 Movie App Backend is running!"})

    @app.route("/api/movies/seed", methods=["GET"])
    def seed_route():
        try:
            fetch_and_seed_movies()
            return jsonify({"message": "✅ Movies seeded successfully!"})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/movies/trending", methods=["GET"])
    def get_trending_movies():
        try:
            result = (
                supabase.table("movies")
                .select("*")
                .order("popularity", desc=True)
                .limit(20)
                .execute()
            )
            return jsonify(result.data)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/movies/search", methods=["GET"])
    def search_movies():
        query = request.args.get("q", "")
        if not query:
            return jsonify({"error": "Search query required"}), 400

        try:
            result = (
                supabase.table("movies")
                .select("*")
                .ilike("title", f"%{query}%")
                .execute()
            )
            return jsonify(result.data)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/movies/nearby", methods=["GET"])
    def get_nearby_movies():
        city = request.args.get("city", "")
        try:
            if city:
                result = (
                    supabase.table("movies")
                    .select("*")
                    .ilike("title", f"%{city}%")
                    .limit(20)
                    .execute()
                )
            else:
                result = supabase.table("movies").select("*").limit(20).execute()
            return jsonify(result.data)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ---------- AUTO-SEED ON STARTUP ----------
    with app.app_context():
        fetch_and_seed_movies()

    return app
