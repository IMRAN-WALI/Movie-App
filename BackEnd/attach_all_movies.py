import os
import sys
import time
import mimetypes
import tempfile
import argparse
import requests
import urllib3
from pathlib import Path
from dotenv import load_dotenv

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

load_dotenv()  # load .env before app.supabase_client reads env vars

from app.supabase_client import get_supabase  # noqa: E402

BUCKET_NAME = "videos"

# Reliable, free, legally-licensed sample/test videos. These are NOT
# copyrighted movie content — they are standard test footage used
# industry-wide for exactly this purpose (testing playback/download
# flows). Confirmed working source.
SAMPLE_VIDEO_URLS = [
    "https://download.samplelib.com/mp4/sample-5s.mp4",
    "https://download.samplelib.com/mp4/sample-10s.mp4",
    "https://download.samplelib.com/mp4/sample-15s.mp4",
    "https://download.samplelib.com/mp4/sample-20s.mp4",
    "https://download.samplelib.com/mp4/sample-30s.mp4",
]


def fetch_movies(limit: int = None, overwrite: bool = False):
    """Returns a list of {id, title}. If overwrite=False, only movies with
    a null/empty video_url. If overwrite=True, ALL movies."""
    supabase = get_supabase()

    query = supabase.table("movies").select("id, title")

    if not overwrite:
        query = query.or_("video_url.is.null,video_url.eq.")

    query = query.order("id")

    if limit:
        query = query.limit(limit)

    result = query.execute()
    return result.data or []


def download_to_temp(url: str, max_retries: int = 3) -> Path:
    """Downloads a remote video to a temp file and returns its local path."""
    suffix = Path(url).suffix or ".mp4"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp_path = Path(tmp.name)
    tmp.close()

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }

    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            with requests.get(
                url, headers=headers, stream=True, verify=False, timeout=60
            ) as response:
                response.raise_for_status()
                with open(tmp_path, "wb") as out_file:
                    for chunk in response.iter_content(chunk_size=8192):
                        out_file.write(chunk)
            return tmp_path
        except Exception as e:
            last_error = e
            if attempt < max_retries:
                wait_time = attempt * 5
                print(f"    ⏳ Attempt {attempt} failed ({e}), retrying in {wait_time}s...")
                time.sleep(wait_time)

    raise last_error


def upload_to_storage(local_file_path: Path) -> str:
    """Uploads a local file to the 'videos' bucket and returns its public URL."""
    supabase = get_supabase()

    storage_path = f"{os.urandom(8).hex()}_{local_file_path.name}"
    guessed_type = mimetypes.guess_type(local_file_path.name)[0]
    content_type = guessed_type or "video/mp4"

    with open(local_file_path, "rb") as f:
        supabase.storage.from_(BUCKET_NAME).upload(
            path=storage_path,
            file=f,
            file_options={"content-type": content_type},
        )

    bucket = supabase.storage.from_(BUCKET_NAME)
    return bucket.get_public_url(storage_path)


def update_movie_video_url(movie_id: int, video_url: str):
    supabase = get_supabase()
    supabase.table("movies").update({"video_url": video_url}).eq(
        "id", movie_id
    ).execute()


def run(limit: int = None, overwrite: bool = False):
    movies = fetch_movies(limit=limit, overwrite=overwrite)

    if not movies:
        print("✅ No movies found to process.")
        return

    print(f"📋 Found {len(movies)} movie(s) to process.\n")

    uploaded_url_cache = {}
    success_count = 0
    failed_count = 0

    for index, movie in enumerate(movies):
        movie_id = movie["id"]
        title = movie.get("title", f"id={movie_id}")

        print(f"▶️  [{index + 1}/{len(movies)}] {title} (id={movie_id})")

        final_url = None
        start = index % len(SAMPLE_VIDEO_URLS)
        ordered_urls = SAMPLE_VIDEO_URLS[start:] + SAMPLE_VIDEO_URLS[:start]

        for sample_url in ordered_urls:
            if sample_url in uploaded_url_cache:
                final_url = uploaded_url_cache[sample_url]
                print(f"  ♻️  Reusing already-uploaded sample: {final_url}")
                break

            try:
                print(f"  ⬇️  Downloading: {sample_url}")
                temp_path = download_to_temp(sample_url)

                print(f"  📤 Uploading to Supabase Storage...")
                final_url = upload_to_storage(temp_path)
                uploaded_url_cache[sample_url] = final_url

                temp_path.unlink(missing_ok=True)
                break
            except Exception as e:
                print(f"  ⚠️  This sample failed ({e}), trying next...")
                continue

        if not final_url:
            print(f"  ❌ All sample sources failed for movie id={movie_id}\n")
            failed_count += 1
            continue

        try:
            update_movie_video_url(movie_id, final_url)
            print(f"  🎉 Linked. video_url set.\n")
            success_count += 1
        except Exception as e:
            print(f"  ❌ DB update failed for movie id={movie_id}: {e}\n")
            failed_count += 1

    print("=" * 50)
    print(f"✅ Success: {success_count}")
    print(f"❌ Failed:  {failed_count}")
    print("=" * 50)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Attach free/legal sample videos to movies."
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Only process this many movies (for testing).",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Replace video_url even for movies that already have one.",
    )
    args = parser.parse_args()

    run(limit=args.limit, overwrite=args.overwrite)