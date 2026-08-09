import argparse
import json
import os
import sys
import tempfile
import time
from pathlib import Path
from typing import Dict, Optional

import requests
from dotenv import load_dotenv

# Make sure we can import from the app package when run from BackEnd/
sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    from app.supabase_client import get_supabase
except ImportError:
    # Fallback if the user runs it from a different location
    try:
        from supabase_client import get_supabase
    except ImportError:
        print("ERROR: Could not import get_supabase().")
        print("Make sure this script lives next to your app/ folder (or adjust the import).")
        sys.exit(1)

load_dotenv()

# ---------------------------------------------------------------------------
# Default mapping – only free/legal sample videos
# Replace / extend with your own movie_id → URL pairs
# ---------------------------------------------------------------------------
DEFAULT_MAPPING: Dict[int, str] = {
    # The 4 movies you already tested
    1:  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    3:  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    5:  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    54: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",

    # Extra free samples – assign to any other movie IDs you have
    2:  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    4:  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    6:  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    7:  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    8:  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    9:  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    10: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
}

BUCKET = "videos"          # your storage bucket name
PUBLIC_BASE = None         # will be filled from supabase client if needed


def get_public_url(supabase, path: str) -> str:
    """Return the public URL for an object in the videos bucket."""
    res = supabase.storage.from_(BUCKET).get_public_url(path)
    # supabase-py sometimes returns a string, sometimes a dict-like
    if isinstance(res, str):
        return res
    return res.get("publicUrl") or res.get("publicURL") or str(res)


def download_to_temp(url: str, movie_id: int) -> Optional[Path]:
    """Stream-download a remote video into a temporary file. Returns Path or None."""
    try:
        print(f"  ↓ Downloading {url[:80]}...")
        with requests.get(url, stream=True, timeout=60) as r:
            r.raise_for_status()
            # Guess extension from Content-Type or URL
            content_type = r.headers.get("Content-Type", "").lower()
            if "mp4" in content_type or url.lower().endswith(".mp4"):
                suffix = ".mp4"
            elif "webm" in content_type:
                suffix = ".webm"
            else:
                suffix = ".mp4"  # safe default

            tmp = tempfile.NamedTemporaryFile(
                delete=False,
                suffix=f"_movie_{movie_id}{suffix}",
                prefix="attach_video_",
            )
            total = 0
            for chunk in r.iter_content(chunk_size=1024 * 1024):  # 1 MB chunks
                if chunk:
                    tmp.write(chunk)
                    total += len(chunk)
            tmp.close()
            size_mb = total / (1024 * 1024)
            print(f"  ✓ Downloaded {size_mb:.1f} MB → {tmp.name}")
            return Path(tmp.name)
    except Exception as e:
        print(f"  ✗ Download failed: {e}")
        return None


def upload_and_link(
    supabase,
    movie_id: int,
    local_path: Path,
    overwrite: bool = False,
) -> bool:
    # Check existing video_url unless overwrite
    if not overwrite:
        existing = (
            supabase.table("movies")
            .select("id, video_url")
            .eq("id", movie_id)
            .maybe_single()
            .execute()
        )
        if existing.data and existing.data.get("video_url"):
            print(f"  ↷ Skipped movie {movie_id} (already has video_url). Use --overwrite to replace.")
            return False

    storage_path = f"{movie_id}{local_path.suffix}"  # e.g. 54.mp4

    try:
        print(f"  ↑ Uploading to {BUCKET}/{storage_path}...")
        with open(local_path, "rb") as f:
            # upsert=True so we can overwrite if needed
            supabase.storage.from_(BUCKET).upload(
                path=storage_path,
                file=f,
                file_options={"content-type": "video/mp4", "upsert": "true"},
            )

        public_url = get_public_url(supabase, storage_path)
        print(f"  🔗 Public URL: {public_url}")

        # Update the movies table
        update = (
            supabase.table("movies")
            .update({"video_url": public_url})
            .eq("id", movie_id)
            .execute()
        )
        if update.data:
            print(f"  ✓ Linked movie {movie_id}")
            return True
        else:
            print(f"  ✗ Failed to update movie row {movie_id}")
            return False

    except Exception as e:
        print(f"  ✗ Upload / update failed for movie {movie_id}: {e}")
        return False
    finally:
        # Always clean up the temp file
        try:
            local_path.unlink(missing_ok=True)
        except Exception:
            pass


def load_mapping(path: Optional[str]) -> Dict[int, str]:
    if not path:
        print("Using built-in DEFAULT_MAPPING")
        return DEFAULT_MAPPING

    p = Path(path)
    if not p.exists():
        print(f"Mapping file not found: {p}")
        sys.exit(1)

    with open(p, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Accept either {"1": "url", ...} or [{"id": 1, "url": "..."}, ...]
    mapping: Dict[int, str] = {}
    if isinstance(data, dict):
        for k, v in data.items():
            mapping[int(k)] = str(v)
    elif isinstance(data, list):
        for item in data:
            mapping[int(item["id"])] = str(item["url"])
    else:
        print("Unsupported mapping format")
        sys.exit(1)

    return mapping


def main():
    parser = argparse.ArgumentParser(description="Attach remote videos to movies via Supabase Storage")
    parser.add_argument("--mapping", "-m", help="JSON file with movie_id → URL mapping")
    parser.add_argument("--overwrite", action="store_true", help="Replace existing video_url values")
    parser.add_argument("--limit", type=int, default=0, help="Process only the first N entries (for testing)")
    args = parser.parse_args()

    mapping = load_mapping(args.mapping)
    if args.limit > 0:
        mapping = dict(list(mapping.items())[: args.limit])

    print(f"\nProcessing {len(mapping)} movie(s)...\n")

    supabase = get_supabase()
    success = skipped = failed = 0

    for movie_id, url in mapping.items():
        print(f"[{movie_id}] {url}")
        local = download_to_temp(url, movie_id)
        if not local:
            failed += 1
            continue

        ok = upload_and_link(supabase, movie_id, local, overwrite=args.overwrite)
        if ok:
            success += 1
        else:
            # Could be a skip or a real failure; upload_and_link already printed the reason
            skipped += 1

        # Be polite to the remote host
        time.sleep(0.5)

    print("\n" + "=" * 50)
    print(f"Done.  Success: {success}  |  Skipped: {skipped}  |  Failed: {failed}")
    print("=" * 50)


if __name__ == "__main__":
    main()