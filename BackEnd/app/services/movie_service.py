import math
import os
import tempfile
import requests

from datetime import datetime
from app.supabase_client import get_supabase


TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

# Supabase Storage bucket
FULL_MOVIES_BUCKET = "full-movies"

# Signed URL lifetime: 2 hours
SIGNED_URL_EXPIRES = 7200


# ============================================================
# TMDB API FUNCTIONS
# ============================================================

def get_tmdb_trending(media_type="movie", time_window="week"):
    """Get trending movies from TMDB."""

    if not TMDB_API_KEY:
        return []

    try:
        url = f"{TMDB_BASE_URL}/trending/{media_type}/{time_window}"

        params = {
            "api_key": TMDB_API_KEY
        }

        response = requests.get(
            url,
            params=params,
            timeout=10
        )

        response.raise_for_status()

        data = response.json()

        movies = []

        for movie in data.get("results", [])[:20]:

            movies.append({
                "id": movie["id"],
                "title": movie["title"],
                "overview": movie.get("overview", ""),

                "poster_url": (
                    f"{TMDB_IMAGE_BASE}/w500{movie['poster_path']}"
                    if movie.get("poster_path")
                    else None
                ),

                "backdrop_url": (
                    f"{TMDB_IMAGE_BASE}/w1280{movie['backdrop_path']}"
                    if movie.get("backdrop_path")
                    else None
                ),

                "release_date": movie.get("release_date"),

                "vote_average": movie.get(
                    "vote_average",
                    0
                ),

                "vote_count": movie.get(
                    "vote_count",
                    0
                ),

                "genres": [],

                "runtime": None,

                "tmdb_id": movie["id"]
            })

        return movies

    except Exception as e:

        print(
            f"❌ TMDB trending error: {e}"
        )

        return []


# ============================================================
# TMDB SEARCH
# ============================================================

def search_tmdb_movies(query, page=1):
    """Search movies on TMDB."""

    if not TMDB_API_KEY or not query:
        return {
            "results": [],
            "total_results": 0,
            "total_pages": 0,
            "page": 1
        }

    try:

        url = f"{TMDB_BASE_URL}/search/movie"

        params = {
            "api_key": TMDB_API_KEY,
            "query": query,
            "page": page,
            "include_adult": False
        }

        response = requests.get(
            url,
            params=params,
            timeout=10
        )

        response.raise_for_status()

        data = response.json()

        movies = []

        for movie in data.get("results", []):

            movies.append({
                "id": movie["id"],
                "title": movie["title"],
                "overview": movie.get(
                    "overview",
                    ""
                ),

                "poster_url": (
                    f"{TMDB_IMAGE_BASE}/w500{movie['poster_path']}"
                    if movie.get("poster_path")
                    else None
                ),

                "backdrop_url": (
                    f"{TMDB_IMAGE_BASE}/w1280{movie['backdrop_path']}"
                    if movie.get("backdrop_path")
                    else None
                ),

                "release_date": movie.get(
                    "release_date"
                ),

                "vote_average": movie.get(
                    "vote_average",
                    0
                ),

                "vote_count": movie.get(
                    "vote_count",
                    0
                ),

                "tmdb_id": movie["id"]
            })

        return {
            "results": movies,
            "total_results": data.get(
                "total_results",
                0
            ),
            "total_pages": data.get(
                "total_pages",
                0
            ),
            "page": data.get(
                "page",
                1
            )
        }

    except Exception as e:

        print(
            f"❌ TMDB search error: {e}"
        )

        return {
            "results": [],
            "total_results": 0,
            "total_pages": 0,
            "page": 1
        }


# ============================================================
# TMDB MOVIE DETAILS
# ============================================================

def get_tmdb_movie_details(movie_id):
    """Get movie details from TMDB."""

    if not TMDB_API_KEY:
        return None

    try:

        url = f"{TMDB_BASE_URL}/movie/{movie_id}"

        params = {
            "api_key": TMDB_API_KEY,
            "append_to_response": "credits,similar,videos"
        }

        response = requests.get(
            url,
            params=params,
            timeout=10
        )

        response.raise_for_status()

        data = response.json()

        # ----------------------------------------------------
        # Genres
        # ----------------------------------------------------

        genres = [
            g["name"]
            for g in data.get(
                "genres",
                []
            )
        ]

        # ----------------------------------------------------
        # Cast
        # ----------------------------------------------------

        cast = []

        for actor in data.get(
            "credits",
            {}
        ).get(
            "cast",
            []
        )[:10]:

            cast.append({
                "id": actor["id"],
                "name": actor["name"],
                "character": actor.get(
                    "character",
                    ""
                ),

                "profile_url": (
                    f"{TMDB_IMAGE_BASE}/w185{actor['profile_path']}"
                    if actor.get("profile_path")
                    else None
                )
            })

        # ----------------------------------------------------
        # Director
        # ----------------------------------------------------

        director = None

        for crew in data.get(
            "credits",
            {}
        ).get(
            "crew",
            []
        ):

            if crew.get("job") == "Director":

                director = crew.get(
                    "name"
                )

                break

        # ----------------------------------------------------
        # YouTube trailers
        # ----------------------------------------------------

        videos = []

        for video in data.get(
            "videos",
            {}
        ).get(
            "results",
            []
        ):

            if (
                video.get("site") == "YouTube"
                and video.get("type")
                in ["Trailer", "Teaser"]
            ):

                videos.append({
                    "key": video["key"],
                    "name": video["name"],
                    "type": video["type"],
                    "url": (
                        f"https://www.youtube.com/watch?v={video['key']}"
                    )
                })

        return {
            "id": data["id"],
            "title": data["title"],
            "overview": data.get(
                "overview",
                ""
            ),

            "poster_url": (
                f"{TMDB_IMAGE_BASE}/w500{data['poster_path']}"
                if data.get("poster_path")
                else None
            ),

            "backdrop_url": (
                f"{TMDB_IMAGE_BASE}/w1280{data['backdrop_path']}"
                if data.get("backdrop_path")
                else None
            ),

            "release_date": data.get(
                "release_date"
            ),

            "genres": genres,

            "runtime": data.get(
                "runtime"
            ),

            "vote_average": data.get(
                "vote_average",
                0
            ),

            "vote_count": data.get(
                "vote_count",
                0
            ),

            "cast": cast,

            "director": director,

            "videos": videos,

            "tagline": data.get(
                "tagline",
                ""
            ),

            "status": data.get(
                "status",
                ""
            ),

            "tmdb_id": data["id"]
        }

    except Exception as e:

        print(
            f"❌ TMDB details error: {e}"
        )

        return None


# ============================================================
# SYNC MOVIE TO SUPABASE
# ============================================================

def sync_movie_to_supabase(tmdb_id):
    """Sync a movie from TMDB to Supabase."""

    try:

        supabase = get_supabase()

        movie_data = get_tmdb_movie_details(
            tmdb_id
        )

        if not movie_data:
            return None

        existing = (
            supabase
            .table("movies")
            .select("id")
            .eq("id", tmdb_id)
            .execute()
        )

        # ----------------------------------------------------
        # Existing movie
        # ----------------------------------------------------

        if existing.data:

            response = (
                supabase
                .table("movies")
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
                })
                .eq("id", tmdb_id)
                .execute()
            )

        # ----------------------------------------------------
        # New movie
        # ----------------------------------------------------

        else:

            response = (
                supabase
                .table("movies")
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

                    # IMPORTANT
                    "video_url": None,
                    "movie_storage_path": None,
                    "video_type": "full_movie",
                    "downloadable": False,

                    "created_at": datetime.utcnow().isoformat()
                })
                .execute()
            )

        return movie_data

    except Exception as e:

        print(
            f"❌ sync_movie_to_supabase error: {e}"
        )

        return None


# ============================================================
# SYNC TRENDING
# ============================================================

def sync_trending_movies():
    """Sync trending movies from TMDB to Supabase."""

    try:

        trending = get_tmdb_trending()

        results = []

        for movie in trending:

            synced = sync_movie_to_supabase(
                movie["id"]
            )

            if synced:
                results.append(
                    synced
                )

        return results

    except Exception as e:

        print(
            f"❌ sync_trending_movies error: {e}"
        )

        return []


# ============================================================
# FETCH TRENDING FROM SUPABASE
# ============================================================

def fetch_trending_movies():
    """Fetch trending movies from Supabase."""

    try:

        supabase = get_supabase()

        response = (
            supabase
            .table("movies")
            .select(
                """
                id,
                title,
                overview,
                poster_url,
                backdrop_url,
                release_date,
                genres,
                vote_average,
                runtime,
                video_type,
                downloadable
                """
            )
            .order(
                "vote_average",
                desc=True
            )
            .limit(10)
            .execute()
        )

        return response.data or []

    except Exception as e:

        print(
            f"❌ fetch_trending_movies error: {e}"
        )

        return []


# ============================================================
# SEARCH MOVIES
# ============================================================

def search_movies(query):
    """
    Search movies from Supabase.

    IMPORTANT:
    We intentionally do NOT return video_url
    or movie_storage_path to the frontend.

    Download URL is generated only by the
    protected /download endpoint.
    """

    try:

        supabase = get_supabase()

        response = (
            supabase
            .table("movies")
            .select(
                """
                id,
                title,
                overview,
                poster_url,
                backdrop_url,
                release_date,
                genres,
                vote_average,
                runtime,
                video_type,
                downloadable
                """
            )
            .ilike(
                "title",
                f"%{query}%"
            )
            .order(
                "vote_average",
                desc=True
            )
            .limit(30)
            .execute()
        )

        return response.data or []

    except Exception as e:

        print(
            f"❌ search_movies error: {e}"
        )

        return []


# ============================================================
# GET MOVIE DETAILS
# ============================================================

def get_movie_details(movie_id):
    """Get movie details by ID."""

    try:

        supabase = get_supabase()

        response = (
            supabase
            .table("movies")
            .select(
                "*"
            )
            .eq(
                "id",
                movie_id
            )
            .single()
            .execute()
        )

        return response.data

    except Exception as e:

        print(
            f"❌ get_movie_details error: {e}"
        )

        return None

# ============================================
# MOVIE CHUNK SYSTEM
# ============================================


CHUNK_SIZE = 45 * 1024 * 1024
# 45 MB

FULL_MOVIE_BUCKET = "full-movies"


def get_movie_chunk_info(movie_id):
    """
    Return movie + chunk information.
    """

    try:
        supabase = get_supabase()

        movie_response = (
            supabase
            .table("movies")
            .select("""
                id,
                title,
                movie_storage_path,
                movie_file_name,
                video_type,
                downloadable,
                chunk_count,
                chunk_size,
                file_size
            """)
            .eq("id", movie_id)
            .single()
            .execute()
        )

        movie = movie_response.data

        if not movie:
            return None

        if movie.get("video_type") != "full_movie":
            print(
                f"❌ Movie {movie_id} is not full_movie"
            )
            return None

        if movie.get("downloadable") is not True:
            print(
                f"❌ Movie {movie_id} is not downloadable"
            )
            return None

        chunks_response = (
            supabase
            .table("movie_chunks")
            .select("""
                chunk_index,
                storage_path,
                chunk_size
            """)
            .eq("movie_id", movie_id)
            .order("chunk_index")
            .execute()
        )

        chunks = chunks_response.data or []

        return {
            "movie": movie,
            "chunks": chunks
        }

    except Exception as e:

        print(
            f"❌ get_movie_chunk_info error: {e}"
        )

        return None


def get_movie_download_manifest(movie_id):
    """
    Generate temporary signed URLs for every movie chunk.
    """

    try:

        supabase = get_supabase()

        result = get_movie_chunk_info(movie_id)

        if not result:
            return None

        movie = result["movie"]
        chunks = result["chunks"]

        if not chunks:
            print(
                f"❌ No chunks found for movie {movie_id}"
            )
            return None

        signed_chunks = []

        for chunk in chunks:

            signed_response = (
                supabase
                .storage
                .from_(FULL_MOVIE_BUCKET)
                .create_signed_url(
                    chunk["storage_path"],
                    7200
                )
            )

            signed_url = None

            if isinstance(signed_response, dict):

                signed_url = (
                    signed_response.get("signedURL")
                    or signed_response.get("signedUrl")
                    or signed_response.get("signed_url")
                )

                data = signed_response.get("data")

                if isinstance(data, dict):

                    signed_url = (
                        signed_url
                        or data.get("signedURL")
                        or data.get("signedUrl")
                        or data.get("signed_url")
                    )

            if not signed_url:

                print(
                    f"❌ Failed signed URL for chunk "
                    f"{chunk['chunk_index']}"
                )

                return None

            signed_chunks.append({
                "index": chunk["chunk_index"],
                "size": chunk["chunk_size"],
                "url": signed_url
            })

        return {
            "movie_id": movie["id"],
            "title": movie["title"],
            "file_name": movie.get(
                "movie_file_name"
            ) or f"{movie['id']}.mp4",
            "file_size": movie.get("file_size") or 0,
            "chunk_size": movie.get(
                "chunk_size"
            ) or CHUNK_SIZE,
            "chunk_count": len(signed_chunks),
            "video_type": "full_movie",
            "chunks": signed_chunks
        }

    except Exception as e:

        print(
            f"❌ Manifest error: {e}"
        )

        return None
    
    """
    Generate temporary signed URLs for every movie chunk.
    """

    try:

        result = get_movie_chunk_info(movie_id)

        if not result:
            return None

        movie = result["movie"]
        chunks = result["chunks"]

        if not chunks:
            print(
                f"❌ No chunks found for movie {movie_id}"
            )
            return None

        signed_chunks = []

        for chunk in chunks:

            signed_response = (
                supabase
                .storage
                .from_(FULL_MOVIE_BUCKET)
                .create_signed_url(
                    chunk["storage_path"],
                    7200
                )
            )

            signed_url = None

            if isinstance(signed_response, dict):

                signed_url = (
                    signed_response.get("signedURL")
                    or signed_response.get("signedUrl")
                    or signed_response.get("signed_url")
                )

                data = signed_response.get("data")

                if isinstance(data, dict):

                    signed_url = (
                        signed_url
                        or data.get("signedURL")
                        or data.get("signedUrl")
                        or data.get("signed_url")
                    )

            if not signed_url:

                print(
                    f"❌ Failed signed URL for chunk "
                    f"{chunk['chunk_index']}"
                )

                return None

            signed_chunks.append({
                "index": chunk["chunk_index"],
                "size": chunk["chunk_size"],
                "url": signed_url
            })

        return {
            "movie_id": movie["id"],
            "title": movie["title"],
            "file_name": movie.get(
                "movie_file_name"
            ) or f"{movie['id']}.mp4",
            "file_size": movie.get("file_size") or 0,
            "chunk_size": movie.get(
                "chunk_size"
            ) or CHUNK_SIZE,
            "chunk_count": len(signed_chunks),
            "video_type": "full_movie",
            "chunks": signed_chunks
        }

    except Exception as e:

        print(
            f"❌ Manifest error: {e}"
        )

        return None
    
    
    """
    Get a temporary signed URL for the FULL movie.

    IMPORTANT:

    This function NEVER uses the old video_url field.

    It uses:

        movie_storage_path

    from:

        full-movies

    Supabase Storage bucket.
    """

    try:

        supabase = get_supabase()

        response = (
            supabase
            .table("movies")
            .select(
                """
                id,
                title,
                movie_storage_path,
                video_type,
                downloadable
                """
            )
            .eq(
                "id",
                movie_id
            )
            .single()
            .execute()
        )

        movie = response.data

        if not movie:

            print(
                f"❌ Movie {movie_id} not found."
            )

            return None

        # ----------------------------------------------------
        # Must be full movie
        # ----------------------------------------------------

        if movie.get(
            "video_type"
        ) != "full_movie":

            print(
                f"❌ Movie {movie_id} is not marked as full_movie."
            )

            return None

        # ----------------------------------------------------
        # Download must be enabled
        # ----------------------------------------------------

        if movie.get(
            "downloadable"
        ) is not True:

            print(
                f"❌ Movie {movie_id} is not downloadable."
            )

            return None

        # ----------------------------------------------------
        # Storage path
        # ----------------------------------------------------

        storage_path = movie.get(
            "movie_storage_path"
        )

        if not storage_path:

            print(
                f"❌ No movie_storage_path for movie {movie_id}."
            )

            return None

        print(
            f"🎬 Creating signed URL:"
            f" movie={movie_id}"
            f" path={storage_path}"
        )

        # ----------------------------------------------------
        # Create signed URL
        # ----------------------------------------------------

        signed_response = (
            supabase
            .storage
            .from_(
                FULL_MOVIES_BUCKET
            )
            .create_signed_url(
                storage_path,
                SIGNED_URL_EXPIRES
            )
        )

        if not signed_response:

            print(
                f"❌ Could not create signed URL "
                f"for movie {movie_id}"
            )

            return None

        # ----------------------------------------------------
        # Extract signed URL
        # ----------------------------------------------------

        signed_url = None

        if isinstance(
            signed_response,
            dict
        ):

            signed_url = (
                signed_response.get(
                    "signedURL"
                )
                or signed_response.get(
                    "signedUrl"
                )
                or signed_response.get(
                    "signed_url"
                )
            )

            data = signed_response.get(
                "data"
            )

            if isinstance(
                data,
                dict
            ):

                signed_url = (
                    signed_url
                    or data.get(
                        "signedURL"
                    )
                    or data.get(
                        "signedUrl"
                    )
                    or data.get(
                        "signed_url"
                    )
                )

        if not signed_url:

            print(
                "❌ Supabase signed URL response:"
            )

            print(
                signed_response
            )

            return None

        print(
            f"✅ Signed FULL MOVIE URL created "
            f"for movie {movie_id}"
        )

        return {
            "id": movie["id"],
            "title": movie["title"],
            "video_url": signed_url,
            "video_type": "full_movie",
            "storage_path": storage_path
        }

    except Exception as e:

        print(
            f"❌ get_movie_video_url error: {e}"
        )

        return None


# ============================================================
# LEGACY VIDEO URL UPDATE
# ============================================================

def update_movie_video_url(movie_id, video_url):
    """
    Legacy function.

    We keep it so existing code does not break.

    New downloads should NOT use video_url.
    """

    try:

        supabase = get_supabase()

        response = (
            supabase
            .table("movies")
            .update({
                "video_url": video_url,
                "updated_at": datetime.utcnow().isoformat()
            })
            .eq(
                "id",
                movie_id
            )
            .execute()
        )

        return response.data

    except Exception as e:

        print(
            f"❌ update_movie_video_url error: {e}"
        )

        return None
    
    
def import_movie_from_url(
    movie_id,
    source_url,
    file_name
):
    """
    Server-side import of an authorized movie source.

    Downloads one 45 MB chunk at a time.
    The complete movie is NEVER loaded into memory.

    Temporary disk usage:
    approximately one chunk only.
    """

    supabase = get_supabase()

    temp_file = None

    try:

        print(
            f"🎬 Starting movie import: "
            f"{movie_id}"
        )

        movie_response = (
            supabase
            .table("movies")
            .select("id,title")
            .eq("id", movie_id)
            .single()
            .execute()
        )

        movie = movie_response.data

        if not movie:
            raise Exception(
                "Movie not found"
            )

        # ----------------------------------------
        # HTTP STREAM
        # ----------------------------------------

        response = requests.get(
            source_url,
            stream=True,
            timeout=60
        )

        response.raise_for_status()

        content_length = response.headers.get(
            "content-length"
        )

        total_size = (
            int(content_length)
            if content_length
            else 0
        )

        if total_size <= 0:

            raise Exception(
                "Source server did not provide "
                "content-length"
            )

        chunk_count = math.ceil(
            total_size / CHUNK_SIZE
        )

        print(
            f"📦 Total size: {total_size} bytes"
        )

        print(
            f"📦 Chunks: {chunk_count}"
        )

        # ----------------------------------------
        # REMOVE OLD CHUNKS
        # ----------------------------------------

        old_chunks = (
            supabase
            .table("movie_chunks")
            .select(
                "id,storage_path"
            )
            .eq("movie_id", movie_id)
            .execute()
        )

        for old in old_chunks.data or []:

            try:

                supabase.storage \
                    .from_(FULL_MOVIE_BUCKET) \
                    .remove([
                        old["storage_path"]
                    ])

            except Exception as delete_error:

                print(
                    "⚠️ Old chunk delete error:",
                    delete_error
                )

        supabase \
            .table("movie_chunks") \
            .delete() \
            .eq("movie_id", movie_id) \
            .execute()

        # ----------------------------------------
        # TEMP FILE
        # ----------------------------------------

        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".part"
        )

        temp_path = temp_file.name

        temp_file.close()

        # ----------------------------------------
        # DOWNLOAD + UPLOAD CHUNKS
        # ----------------------------------------

        current_chunk = 0
        current_size = 0

        def upload_current_chunk(
            chunk_index,
            size
        ):

            storage_path = (
                f"{movie_id}/"
                f"{chunk_index:06d}.part"
            )

            print(
                f"⬆️ Uploading chunk "
                f"{chunk_index}/{chunk_count}"
            )

            with open(
                temp_path,
                "rb"
            ) as file:

                upload_result = (
                    supabase
                    .storage
                    .from_(FULL_MOVIE_BUCKET)
                    .upload(
                        storage_path,
                        file,
                        {
                            "content-type":
                                "application/octet-stream",
                            "upsert": "true"
                        }
                    )
                )

            if upload_result is None:
                raise Exception(
                    f"Chunk upload failed: "
                    f"{chunk_index}"
                )

            supabase \
                .table("movie_chunks") \
                .insert({
                    "movie_id": movie_id,
                    "chunk_index": chunk_index,
                    "storage_path": storage_path,
                    "chunk_size": size
                }) \
                .execute()

        with open(
            temp_path,
            "wb"
        ) as output:

            for data in response.iter_content(
                chunk_size=1024 * 1024
            ):

                if not data:
                    continue

                output.write(data)

                current_size += len(data)

                if current_size >= CHUNK_SIZE:

                    output.close()

                    upload_current_chunk(
                        current_chunk,
                        current_size
                    )

                    current_chunk += 1
                    current_size = 0

                    output = open(
                        temp_path,
                        "wb"
                    )

        # ----------------------------------------
        # LAST CHUNK
        # ----------------------------------------

        if current_size > 0:

            output.close()

            upload_current_chunk(
                current_chunk,
                current_size
            )

        # ----------------------------------------
        # UPDATE MOVIE
        # ----------------------------------------

        supabase \
            .table("movies") \
            .update({
                "movie_storage_path":
                    f"{movie_id}/",
                "movie_file_name":
                    file_name,
                "video_type":
                    "full_movie",
                "downloadable":
                    True,
                "chunk_count":
                    chunk_count,
                "chunk_size":
                    CHUNK_SIZE,
                "file_size":
                    total_size,
                "source_video_url":
                    source_url,
                "source_type":
                    "authorized_external",
                "video_url":
                    None,
                "updated_at":
                    datetime.utcnow().isoformat()
            }) \
            .eq("id", movie_id) \
            .execute()

        print(
            f"✅ Movie import completed: "
            f"{movie_id}"
        )

        return {
            "movie_id": movie_id,
            "file_name": file_name,
            "file_size": total_size,
            "chunk_count": chunk_count,
            "chunk_size": CHUNK_SIZE
        }

    except Exception as e:

        print(
            f"❌ Movie import failed: {e}"
        )

        raise

    finally:

        if temp_file:

            try:
                os.unlink(
                    temp_file.name
                )
            except Exception:
                pass