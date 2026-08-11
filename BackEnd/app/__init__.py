# BackEnd/app/__init__.py
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
                        "poster_url": f"https://image.tmdb.org/t/p/w500{movie.get('poster_path', '')}" if movie.get('poster_path') else "",
                        "backdrop_url": f"https://image.tmdb.org/t/p/w1280{movie.get('backdrop_path', '')}" if movie.get('backdrop_path') else "",
                        "release_date": movie.get("release_date", ""),
                        "vote_average": movie.get("vote_average", 0),
                        "vote_count": movie.get("vote_count", 0),
                        "popularity": movie.get("popularity", 0),
                        "genres": [],  # Will be populated later
                        "runtime": None,
                        "video_url": None,  # For downloads
                    }
                )

            result = supabase.table("movies").insert(movies).execute()
            print(f"✅ {len(movies)} movies inserted from TMDB!")

        except Exception as e:
            print(f"❌ Seed failed: {e}")

    # ---------- ROUTES ----------

    @app.route("/")
    def home():
        return jsonify({
            "message": "🎬 Movie App Backend is running!",
            "version": "1.0.0",
            "endpoints": {
                "movies": {
                    "trending": "/api/movies/trending",
                    "search": "/api/movies/search?q=query",
                    "nearby": "/api/movies/nearby?city=city",
                    "seed": "/api/movies/seed",
                    "details": "/api/movies/<id>",
                    "download": "/api/movies/<id>/download"
                }
            }
        })

    @app.route("/health")
    def health():
        return jsonify({"status": "ok", "message": "Server is running"}), 200

    # ---------- MOVIES ROUTES ----------

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
            return jsonify({"results": result.data, "source": "supabase"})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/movies/search", methods=["GET"])
    def search_movies():
        query = request.args.get("q", "")
        if not query:
            return jsonify({"error": "Search query required"}), 400

        try:
            # Search in Supabase
            result = (
                supabase.table("movies")
                .select("*")
                .ilike("title", f"%{query}%")
                .order("popularity", desc=True)
                .limit(20)
                .execute()
            )
            
            # If not enough results, fetch from TMDB
            if len(result.data) < 10 and tmdb_api_key:
                try:
                    url = f"https://api.themoviedb.org/3/search/movie?api_key={tmdb_api_key}&query={query}&language=en-US"
                    response = requests.get(url)
                    data = response.json()
                    
                    for movie in data.get("results", [])[:10]:
                        # Check if already in Supabase
                        existing = supabase.table("movies").select("id").eq("id", movie["id"]).execute()
                        if not existing.data:
                            # Insert new movie
                            supabase.table("movies").insert({
                                "id": movie["id"],
                                "title": movie["title"],
                                "overview": movie.get("overview", ""),
                                "poster_url": f"https://image.tmdb.org/t/p/w500{movie.get('poster_path', '')}" if movie.get('poster_path') else "",
                                "release_date": movie.get("release_date", ""),
                                "vote_average": movie.get("vote_average", 0),
                                "vote_count": movie.get("vote_count", 0),
                                "popularity": movie.get("popularity", 0),
                                "video_url": None
                            }).execute()
                except Exception as e:
                    print(f"⚠️ TMDB search error: {e}")
            
            # Fetch fresh results
            result = (
                supabase.table("movies")
                .select("*")
                .ilike("title", f"%{query}%")
                .order("popularity", desc=True)
                .limit(30)
                .execute()
            )
            
            return jsonify({"results": result.data, "source": "supabase+tmdb"})
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
            return jsonify({"results": result.data})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/movies/<int:movie_id>", methods=["GET"])
    def get_movie_details(movie_id):
        try:
            # Try Supabase first
            result = supabase.table("movies").select("*").eq("id", movie_id).single().execute()
            
            if not result.data and tmdb_api_key:
                # Fetch from TMDB
                url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={tmdb_api_key}&language=en-US&append_to_response=credits"
                response = requests.get(url)
                if response.status_code == 200:
                    data = response.json()
                    movie_data = {
                        "id": data["id"],
                        "title": data["title"],
                        "overview": data.get("overview", ""),
                        "poster_url": f"https://image.tmdb.org/t/p/w500{data.get('poster_path', '')}" if data.get('poster_path') else "",
                        "backdrop_url": f"https://image.tmdb.org/t/p/w1280{data.get('backdrop_path', '')}" if data.get('backdrop_path') else "",
                        "release_date": data.get("release_date", ""),
                        "vote_average": data.get("vote_average", 0),
                        "vote_count": data.get("vote_count", 0),
                        "runtime": data.get("runtime"),
                        "genres": [g["name"] for g in data.get("genres", [])],
                        "tagline": data.get("tagline", ""),
                        "status": data.get("status", ""),
                        "video_url": None
                    }
                    return jsonify(movie_data)
            
            return jsonify(result.data)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/movies/<int:movie_id>/download", methods=["GET"])
    def get_download_url(movie_id):
        try:
            result = supabase.table("movies").select("id, title, video_url").eq("id", movie_id).single().execute()
            
            if not result.data or not result.data.get("video_url"):
                return jsonify({"error": "No video available for download"}), 404
            
            return jsonify({
                "movie_id": movie_id,
                "title": result.data.get("title"),
                "video_url": result.data["video_url"]
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ---------- AUTO-SEED ON STARTUP ----------
    with app.app_context():
        fetch_and_seed_movies()

    return app