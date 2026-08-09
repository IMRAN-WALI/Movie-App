import mimetypes
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()  # load .env before app.supabase_client reads env vars

from app.supabase_client import get_supabase  # noqa: E402

BUCKET_NAME = "videos"


def upload_to_storage(local_file_path: str) -> str:
    supabase = get_supabase()
    file_path = Path(local_file_path)

    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {local_file_path}")

    storage_path = f"{os.urandom(8).hex()}_{file_path.name}"
    guessed_type = mimetypes.guess_type(file_path.name)[0]
    content_type = guessed_type or "video/mp4"

    print(f"📤 Uploading '{file_path.name}' " f"to bucket '{BUCKET_NAME}'...")

    with open(file_path, "rb") as f:
        bucket = supabase.storage.from_(BUCKET_NAME)
        bucket.upload(
            path=storage_path,
            file=f,
            file_options={"content-type": content_type},
        )

    bucket = supabase.storage.from_(BUCKET_NAME)
    public_url = bucket.get_public_url(storage_path)
    print(f"✅ Uploaded. Public URL: {public_url}")

    return public_url


def attach_video_to_movie(movie_id: int, local_file_path: str):
    """Uploads the video and updates the movie's video_url column."""
    supabase = get_supabase()
    file_url = upload_to_storage(local_file_path)

    print(f"🔄 Updating movie id={movie_id} with new video_url...")

    result = (
        supabase.table("movies")
        .update({"video_url": file_url})
        .eq("id", movie_id)
        .execute()
    )

    if not result.data:
        print(f"⚠️ No movie found with id={movie_id}. Nothing was updated.")
        return None

    title = result.data[0].get("title", movie_id)
    print(f"🎉 Done! Movie '{title}' now has a video.")
    return result.data[0]


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python attach_video.py <movie_id> <path_to_video_file>")
        sys.exit(1)

    movie_id_arg = int(sys.argv[1])
    file_path_arg = sys.argv[2]

    attach_video_to_movie(movie_id_arg, file_path_arg)
