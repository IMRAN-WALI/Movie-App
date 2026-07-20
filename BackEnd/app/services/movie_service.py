import os
import requests

TMDB_BASE_URL = "https://api.themoviedb.org/3"


def fetch_trending_movies(time_window="day"):
    api_key = os.getenv("TMDB_API_KEY")
    if not api_key:
        raise RuntimeError("Missing TMDB_API_KEY env var")

    resp = requests.get(
        f"{TMDB_BASE_URL}/trending/movie/{time_window}",
        params={"api_key": api_key},
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()

    return [
        {
            "tmdb_id": item.get("id"),
            "title": item.get("title"),
            "overview": item.get("overview"),
            "poster_url": (
                f"https://image.tmdb.org/t/p/w500{item['poster_path']}"
                if item.get("poster_path")
                else None
            ),
            "release_date": item.get("release_date"),
            "vote_average": item.get("vote_average"),
        }
        for item in data.get("results", [])
    ]
