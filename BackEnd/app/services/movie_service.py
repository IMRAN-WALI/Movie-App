import os
import requests
from datetime import datetime
from app.supabase_client import get_supabase  # ✅ Correct import

TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

# ============================================
# TMDB API FUNCTIONS
# ============================================

def get_tmdb_trending(media_type="movie", time_window="week"):
    """Get trending movies from TMDB"""
    if not TMDB_API_KEY:
        return []
    
    try:
        url = f"{TMDB_BASE_URL}/trending/{media_type}/{time_window}"
        params = {"api_key": TMDB_API_KEY}
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        movies = []
        for movie in data.get("results", [])[:20]:
            movies.append({
                "id": movie["id"],
                "title": movie["title"],
                "overview": movie.get("overview", ""),
                "poster_url": f"{TMDB_IMAGE_BASE}/w500{movie['poster_path']}" if movie.get("poster_path") else None,
                "backdrop_url": f"{TMDB_IMAGE_BASE}/w1280{movie['backdrop_path']}" if movie.get("backdrop_path") else None,
                "release_date": movie.get("release_date"),
                "vote_average": movie.get("vote_average", 0),
                "vote_count": movie.get("vote_count", 0),
                "genres": [],  # Will fetch separately if needed
                "runtime": None,
                "tmdb_id": movie["id"]
            })
        
        return movies
    except Exception as e:
        print(f"❌ TMDB trending error: {e}")
        return []

def search_tmdb_movies(query, page=1):
    """Search movies on TMDB"""
    if not TMDB_API_KEY or not query:
        return {"results": [], "total_results": 0, "total_pages": 0, "page": 1}
    
    try:
        url = f"{TMDB_BASE_URL}/search/movie"
        params = {
            "api_key": TMDB_API_KEY,
            "query": query,
            "page": page,
            "include_adult": False
        }
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        movies = []
        for movie in data.get("results", []):
            movies.append({
                "id": movie["id"],
                "title": movie["title"],
                "overview": movie.get("overview", ""),
                "poster_url": f"{TMDB_IMAGE_BASE}/w500{movie['poster_path']}" if movie.get("poster_path") else None,
                "backdrop_url": f"{TMDB_IMAGE_BASE}/w1280{movie['backdrop_path']}" if movie.get("backdrop_path") else None,
                "release_date": movie.get("release_date"),
                "vote_average": movie.get("vote_average", 0),
                "vote_count": movie.get("vote_count", 0),
                "tmdb_id": movie["id"]
            })
        
        return {
            "results": movies,
            "total_results": data.get("total_results", 0),
            "total_pages": data.get("total_pages", 0),
            "page": data.get("page", 1)
        }
    except Exception as e:
        print(f"❌ TMDB search error: {e}")
        return {"results": [], "total_results": 0, "total_pages": 0, "page": 1}

def get_tmdb_movie_details(movie_id):
    """Get movie details from TMDB"""
    if not TMDB_API_KEY:
        return None
    
    try:
        url = f"{TMDB_BASE_URL}/movie/{movie_id}"
        params = {
            "api_key": TMDB_API_KEY,
            "append_to_response": "credits,similar,videos"
        }
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        genres = [g["name"] for g in data.get("genres", [])]
        
        # Get cast
        cast = []
        for actor in data.get("credits", {}).get("cast", [])[:10]:
            cast.append({
                "id": actor["id"],
                "name": actor["name"],
                "character": actor.get("character", ""),
                "profile_url": f"{TMDB_IMAGE_BASE}/w185{actor['profile_path']}" if actor.get("profile_path") else None
            })
        
        # Get director
        director = None
        for crew in data.get("credits", {}).get("crew", []):
            if crew.get("job") == "Director":
                director = crew.get("name")
                break
        
        # Get videos (trailers)
        videos = []
        for video in data.get("videos", {}).get("results", []):
            if video.get("site") == "YouTube" and video.get("type") in ["Trailer", "Teaser"]:
                videos.append({
                    "key": video["key"],
                    "name": video["name"],
                    "type": video["type"],
                    "url": f"https://www.youtube.com/watch?v={video['key']}"
                })
        
        return {
            "id": data["id"],
            "title": data["title"],
            "overview": data.get("overview", ""),
            "poster_url": f"{TMDB_IMAGE_BASE}/w500{data['poster_path']}" if data.get("poster_path") else None,
            "backdrop_url": f"{TMDB_IMAGE_BASE}/w1280{data['backdrop_path']}" if data.get("backdrop_path") else None,
            "release_date": data.get("release_date"),
            "genres": genres,
            "runtime": data.get("runtime"),
            "vote_average": data.get("vote_average", 0),
            "vote_count": data.get("vote_count", 0),
            "cast": cast,
            "director": director,
            "videos": videos,
            "tagline": data.get("tagline", ""),
            "status": data.get("status", ""),
            "tmdb_id": data["id"]
        }
    except Exception as e:
        print(f"❌ TMDB details error: {e}")
        return None

def sync_movie_to_supabase(tmdb_id):
    """Sync a movie from TMDB to Supabase"""
    try:
        supabase = get_supabase()
        movie_data = get_tmdb_movie_details(tmdb_id)
        if not movie_data:
            return None
        
        # Check if movie already exists
        existing = supabase.table("movies").select("id").eq("id", tmdb_id).execute()
        
        if existing.data:
            # Update existing movie
            response = supabase.table("movies") \
                .update({
                    "title": movie_data["title"],
                    "overview": movie_data["overview"],
                    "poster_url": movie_data["poster_url"],
                    "backdrop_url": movie_data["backdrop_url"],
                    "release_date": movie_data["release_date"],
                    "genres": movie_data["genres"],
                    "runtime": movie_data["runtime"],
                    "vote_average": movie_data["vote_average"],
                    "updated_at": datetime.utcnow().isoformat()
                }) \
                .eq("id", tmdb_id) \
                .execute()
        else:
            # Insert new movie
            response = supabase.table("movies") \
                .insert({
                    "id": tmdb_id,
                    "title": movie_data["title"],
                    "overview": movie_data["overview"],
                    "poster_url": movie_data["poster_url"],
                    "backdrop_url": movie_data["backdrop_url"],
                    "release_date": movie_data["release_date"],
                    "genres": movie_data["genres"],
                    "runtime": movie_data["runtime"],
                    "vote_average": movie_data["vote_average"],
                    "video_url": None,  # Will be set later for downloads
                    "created_at": datetime.utcnow().isoformat()
                }) \
                .execute()
        
        return movie_data
    except Exception as e:
        print(f"❌ sync_movie_to_supabase error: {e}")
        return None

def sync_trending_movies():
    """Sync trending movies from TMDB to Supabase"""
    try:
        trending = get_tmdb_trending()
        results = []
        for movie in trending:
            synced = sync_movie_to_supabase(movie["id"])
            if synced:
                results.append(synced)
        return results
    except Exception as e:
        print(f"❌ sync_trending_movies error: {e}")
        return []

# ============================================
# SUPABASE MOVIE FUNCTIONS
# ============================================

def fetch_trending_movies():
    """Fetch trending movies from Supabase"""
    try:
        supabase = get_supabase()  # ✅ Use supabase_client
        response = supabase.table("movies") \
            .select("*") \
            .order("vote_average", desc=True) \
            .limit(10) \
            .execute()
        return response.data
    except Exception as e:
        print(f"❌ fetch_trending_movies error: {e}")
        return []

def search_movies(query):
    """Search movies by title"""
    try:
        supabase = get_supabase()  # ✅ Use supabase_client
        response = supabase.table("movies") \
            .select("*") \
            .ilike("title", f"%{query}%") \
            .order("vote_average", desc=True) \
            .limit(30) \
            .execute()
        return response.data
    except Exception as e:
        print(f"❌ search_movies error: {e}")
        return []
    
    """Search movies by title (TMDB + Supabase)"""
    try:
        supabase = get_supabase()
        
        # First search in Supabase
        response = supabase.table("movies") \
            .select("*") \
            .ilike("title", f"%{query}%") \
            .order("vote_average", desc=True) \
            .limit(10) \
            .execute()
        
        supabase_results = response.data or []
        supabase_ids = [m["id"] for m in supabase_results]
        
        # If not enough results, search TMDB
        if len(supabase_results) < 20:
            tmdb_results = search_tmdb_movies(query)
            for movie in tmdb_results.get("results", []):
                if movie["id"] not in supabase_ids:
                    # Check if movie exists in Supabase (maybe from previous sync)
                    existing = supabase.table("movies") \
                        .select("*") \
                        .eq("id", movie["id"]) \
                        .execute()
                    
                    if existing.data:
                        supabase_results.append(existing.data[0])
                    else:
                        supabase_results.append(movie)
        
        return supabase_results[:30]
    except Exception as e:
        print(f"❌ search_movies error: {e}")
        return []

def get_movie_details(movie_id):
    """Get movie details by ID"""
    try:
        supabase = get_supabase()
        response = supabase.table("movies") \
            .select("*") \
            .eq("id", movie_id) \
            .single() \
            .execute()
        return response.data
    except Exception as e:
        print(f"❌ get_movie_details error: {e}")
        return None

def get_movie_video_url(movie_id):
    """Get video URL for a movie"""
    try:
        supabase = get_supabase()
        response = supabase.table("movies") \
            .select("id, title, video_url") \
            .eq("id", movie_id) \
            .single() \
            .execute()
        return response.data
    except Exception as e:
        print(f"❌ get_movie_video_url error: {e}")
        return None

def update_movie_video_url(movie_id, video_url):
    """Update movie video URL for download"""
    try:
        supabase = get_supabase()
        response = supabase.table("movies") \
            .update({
                "video_url": video_url,
                "updated_at": datetime.utcnow().isoformat()
            }) \
            .eq("id", movie_id) \
            .execute()
        return response.data
    except Exception as e:
        print(f"❌ update_movie_video_url error: {e}")
        return None