"""
One-time / repeatable script to pull trending + popular movies from TMDB
and upsert them into the Supabase `movies` table.

Run with:  python sync_movies.py
(venv activated, .env filled in — uses the same env vars as run.py)
"""

import os
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
TMDB_API_KEY = os.getenv("TMDB_API_KEY")

TMDB_BASE_URL = "https://api.themoviedb.org/3"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def fetch_genre_map():
    resp = requests.get(
        f"{TMDB_BASE_URL}/genre/movie/list",
        params={"api_key": TMDB_API_KEY},
        timeout=10,
    )
    resp.raise_for_status()
    genres = resp.json().get("genres", [])
    return {g["id"]: g["name"] for g in genres}


def fetch_movies(endpoint, pages=2):
    all_results = []
    for page in range(1, pages + 1):
        resp = requests.get(
            f"{TMDB_BASE_URL}/{endpoint}",
            params={"api_key": TMDB_API_KEY, "page": page},
            timeout=10,
        )
        resp.raise_for_status()
        all_results.extend(resp.json().get("results", []))
    return all_results


def main():
    print("Fetching genre list from TMDB...")
    genre_map = fetch_genre_map()

    print("Fetching trending + popular movies from TMDB...")
    trending = fetch_movies("trending/movie/week", pages=2)
    popular = fetch_movies("movie/popular", pages=2)

    combined = {m["id"]: m for m in trending + popular}.values()

    rows = []
    for m in combined:
        genre_names = [genre_map.get(gid, "Unknown") for gid in m.get("genre_ids", [])]
        rows.append(
            {
                "tmdb_id": m.get("id"),
                "title": m.get("title"),
                "overview": m.get("overview"),
                "poster_url": (
                    f"https://image.tmdb.org/t/p/w500{m['poster_path']}"
                    if m.get("poster_path")
                    else None
                ),
                "backdrop_url": (
                    f"https://image.tmdb.org/t/p/w780{m['backdrop_path']}"
                    if m.get("backdrop_path")
                    else None
                ),
                "release_date": m.get("release_date") or None,
                "genres": genre_names,
                "vote_average": m.get("vote_average"),
            }
        )

    print(f"Upserting {len(rows)} movies into Supabase...")
    result = supabase.table("movies").upsert(rows, on_conflict="tmdb_id").execute()
    print(f"Done. {len(result.data)} rows written.")


if __name__ == "__main__":
    main()
