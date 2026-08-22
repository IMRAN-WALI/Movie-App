import os
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from supabase import create_client
import requests
from dotenv import load_dotenv
import json
from datetime import datetime

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
                # Release date parse karo
                release_date = movie.get("release_date", "")
                try:
                    if release_date:
                        release_date = datetime.strptime(release_date, "%Y-%m-%d").date()
                except:
                    release_date = None
                
                # Genres array
                genres = movie.get("genre_ids", [])
                
                movies.append(
                    {
                        "id": movie["id"],  # TMDB ID
                        "tmdb_id": movie["id"],
                        "title": movie["title"],
                        "overview": movie.get("overview", ""),
                        "poster_url": f"https://image.tmdb.org/t/p/w500{movie.get('poster_path', '')}" if movie.get('poster_path') else None,
                        "backdrop_url": f"https://image.tmdb.org/t/p/w1280{movie.get('backdrop_path', '')}" if movie.get('backdrop_path') else None,
                        "release_date": release_date,
                        "genres": genres,
                        "runtime": None,
                        "vote_average": movie.get("vote_average", 0),
                        "video_url": "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
                        "movie_storage_path": None,
                        "video_type": "online",
                        "downloadable": True,
                        "chunk_count": 0,
                        "chunk_size": 0,
                        "file_size": 0,
                        "source_video_url": None,
                        "source_type": "tmdb",
                        "movie_file_name": None
                    }
                )

            # Batch insert (10 at a time)
            for i in range(0, len(movies), 10):
                batch = movies[i:i+10]
                result = supabase.table("movies").insert(batch).execute()
                print(f"✅ Inserted batch {i//10 + 1}: {len(batch)} movies")

            print(f"✅ {len(movies)} movies inserted from TMDB!")

        except Exception as e:
            print(f"❌ Seed failed: {e}")

    # ---------- ROUTES ----------

    @app.route("/")
    def home():
        return jsonify({
            "message": "🎬 Movie App Backend is running!",
            "endpoints": {
                "/health": "Health check",
                "/api/movies/trending": "Get trending movies",
                "/api/movies/search?q=title": "Search movies",
                "/api/movies/nearby?city=name": "Get nearby movies",
                "/api/movies/<id>/download": "Download movie",
                "/api/movies/<id>/video": "Stream video"
            }
        })

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "ok",
            "message": "Backend is running!",
            "supabase_connected": bool(supabase_url and supabase_key),
            "tmdb_connected": bool(tmdb_api_key)
        })

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
            # vote_average se sort karo (kyunki popularity column nahi hai)
            try:
                result = (
                    supabase.table("movies")
                    .select("*")
                    .order("vote_average", desc=True)  # ✅ vote_average se sort
                    .limit(20)
                    .execute()
                )
                if result.data:
                    return jsonify(result.data)
            except Exception as e:
                print(f"⚠️ Order by vote_average failed: {e}")
            
            # Fallback: release_date se sort
            try:
                result = (
                    supabase.table("movies")
                    .select("*")
                    .order("release_date", desc=True)
                    .limit(20)
                    .execute()
                )
                if result.data:
                    return jsonify(result.data)
            except:
                pass
            
            # Final fallback: Simple select
            result = supabase.table("movies").select("*").limit(20).execute()
            
            if not result.data:
                # Agar data nahi hai toh seed karo
                fetch_and_seed_movies()
                result = supabase.table("movies").select("*").limit(20).execute()
            
            return jsonify(result.data)
            
        except Exception as e:
            print(f"❌ Trending error: {e}")
            return jsonify({"error": str(e), "message": "Could not fetch movies"}), 500

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
                .limit(20)
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

    # ============================================================
    # 🔥 DOWNLOAD ENDPOINT
    # ============================================================
    @app.route("/api/movies/<int:movie_id>/download", methods=["GET"])
    def download_movie(movie_id):
        try:
            # Movie details fetch karo
            result = supabase.table("movies").select("*").eq("id", movie_id).execute()
            
            if not result.data:
                return jsonify({"error": "Movie not found"}), 404
            
            movie = result.data[0]
            
            # Video URL check karo
            video_url = movie.get("video_url")
            
            # Agar video_url nahi hai toh sample video use karo
            if not video_url:
                video_url = "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"
            
            # Check if video is downloadable
            downloadable = movie.get("downloadable", True)
            
            return jsonify({
                "status": "success",
                "movie_id": movie_id,
                "tmdb_id": movie.get("tmdb_id"),
                "title": movie.get("title"),
                "video_url": video_url,
                "download_url": video_url,
                "poster_url": movie.get("poster_url"),
                "backdrop_url": movie.get("backdrop_url"),
                "overview": movie.get("overview"),
                "release_date": movie.get("release_date"),
                "vote_average": movie.get("vote_average"),
                "downloadable": downloadable,
                "file_size": movie.get("file_size"),
                "video_type": movie.get("video_type", "online")
            })
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ============================================================
    # 🔥 VIDEO STREAM
    # ============================================================
    @app.route("/api/movies/<int:movie_id>/video", methods=["GET"])
    def stream_video(movie_id):
        try:
            result = supabase.table("movies").select("*").eq("id", movie_id).execute()
            
            if not result.data:
                return jsonify({"error": "Movie not found"}), 404
            
            movie = result.data[0]
            video_url = movie.get("video_url")
            
            if not video_url:
                # Sample video fallback
                video_url = "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"
            
            # Agar video URL hai toh redirect karo
            return jsonify({
                "stream_url": video_url,
                "title": movie.get("title"),
                "poster_url": movie.get("poster_url")
            })
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ============================================================
    # 🔥 GET MOVIE BY ID
    # ============================================================
    @app.route("/api/movies/<int:movie_id>", methods=["GET"])
    def get_movie(movie_id):
        try:
            result = supabase.table("movies").select("*").eq("id", movie_id).execute()
            
            if not result.data:
                return jsonify({"error": "Movie not found"}), 404
            
            return jsonify(result.data[0])
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ============================================================
    # 🔥 UPDATE MOVIE VIDEO URL
    # ============================================================
    @app.route("/api/movies/<int:movie_id>/video-url", methods=["POST"])
    def update_video_url(movie_id):
        try:
            data = request.get_json()
            video_url = data.get("video_url")
            
            if not video_url:
                return jsonify({"error": "video_url required"}), 400
            
            result = supabase.table("movies").update({
                "video_url": video_url,
                "video_type": "uploaded",
                "downloadable": True
            }).eq("id", movie_id).execute()
            
            if not result.data:
                return jsonify({"error": "Movie not found"}), 404
            
            return jsonify({
                "status": "success",
                "message": "Video URL updated",
                "movie": result.data[0]
            })
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ---------- AUTO-SEED ON STARTUP ----------
    with app.app_context():
        fetch_and_seed_movies()

    return app

# ---------- RUN ----------
if __name__ == "__main__":
    app = create_app()
    print("\n" + "="*50)
    print("🚀 Movie App Backend Started!")
    print("="*50)
    print("Health Check: http://localhost:5000/health")
    print("Trending Movies: http://localhost:5000/api/movies/trending")
    print("Test Download: http://localhost:5000/api/movies/1/download")
    print("="*50 + "\n")
    app.run(debug=True, host="0.0.0.0", port=5000)