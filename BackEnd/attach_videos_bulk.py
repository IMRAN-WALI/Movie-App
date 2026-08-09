import os
import sys
import mimetypes
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()  # load .env before app.supabase_client reads env vars

from app.supabase_client import get_supabase  # noqa: E402

BUCKET_NAME = "videos"
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".m4v", ".mkv"}


def upload_to_storage(local_file_path: Path) -> str:
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


def get_existing_video_url(movie_id: int):
    supabase = get_supabase()
    result = (
        supabase.table("movies")
        .select("id, title, video_url")
        .eq("id", movie_id)
        .maybe_single()
        .execute()
    )
    if not result.data:
        return "NOT_FOUND", None
    return result.data.get("title"), result.data.get("video_url")


def attach_video_to_movie(movie_id: int, local_file_path: Path) -> bool:
    """Uploads the video and updates the movie's video_url column."""
    supabase = get_supabase()
    file_url = upload_to_storage(local_file_path)

    result = (
        supabase.table("movies")
        .update({"video_url": file_url})
        .eq("id", movie_id)
        .execute()
    )

    if not result.data:
        print(f"  ⚠️  No movie found with id={movie_id}. Skipped DB update.")
        return False

    title = result.data[0].get("title", movie_id)
    print(f"  🎉 Linked to movie '{title}' (id={movie_id})")
    return True


def run_bulk_upload(folder_path: str, overwrite: bool = False):
    folder = Path(folder_path)

    if not folder.exists() or not folder.is_dir():
        print(f"❌ Folder not found: {folder_path}")
        sys.exit(1)

    video_files = [
        f
        for f in folder.iterdir()
        if f.is_file() and f.suffix.lower() in ALLOWED_EXTENSIONS
    ]

    if not video_files:
        print(f"⚠️ No video files found in {folder_path}")
        return

    print(f"📂 Found {len(video_files)} video file(s) in {folder_path}\n")

    success_count = 0
    skipped_count = 0
    failed_count = 0

    for file_path in sorted(video_files):
        filename_no_ext = file_path.stem  # e.g. "54" from "54.mp4"

        if not filename_no_ext.isdigit():
            print(
                f"⏭️  Skipping '{file_path.name}' — filename is not a numeric movie id"
            )
            skipped_count += 1
            continue

        movie_id = int(filename_no_ext)
        print(f"▶️  Processing movie id={movie_id} ({file_path.name})")

        title, existing_url = get_existing_video_url(movie_id)

        if title == "NOT_FOUND":
            print(f"  ⚠️  No movie with id={movie_id} exists in the database. Skipped.")
            skipped_count += 1
            continue

        if existing_url and not overwrite:
            print(
                f"  ⏭️  Movie '{title}' already has a video_url. Skipped (use --overwrite to replace)."
            )
            skipped_count += 1
            continue

        try:
            print(f"  📤 Uploading '{file_path.name}'...")
            ok = attach_video_to_movie(movie_id, file_path)
            if ok:
                success_count += 1
            else:
                failed_count += 1
        except Exception as e:
            print(f"  ❌ Failed for movie id={movie_id}: {e}")
            failed_count += 1

        print()

    print("=" * 50)
    print(f"✅ Success: {success_count}")
    print(f"⏭️  Skipped: {skipped_count}")
    print(f"❌ Failed:  {failed_count}")
    print("=" * 50)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(
            'Usage: python attach_videos_bulk.py "C:/path/to/videos_to_upload" [--overwrite]'
        )
        sys.exit(1)

    folder_arg = sys.argv[1]
    overwrite_flag = "--overwrite" in sys.argv

    run_bulk_upload(folder_arg, overwrite=overwrite_flag)
