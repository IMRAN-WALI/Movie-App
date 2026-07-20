import uuid
from werkzeug.utils import secure_filename
from app.supabase_client import get_supabase

CLIPS_BUCKET = "clips"


def upload_clip(user_id, movie_id, caption, city, file_storage):
    supabase = get_supabase()

    filename = secure_filename(file_storage.filename or "clip.mp4")
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "mp4"
    storage_path = f"{user_id}/{uuid.uuid4().hex}.{ext}"

    file_bytes = file_storage.read()

    supabase.storage.from_(CLIPS_BUCKET).upload(
        storage_path,
        file_bytes,
        {"content-type": file_storage.mimetype or "video/mp4"},
    )

    public_url = supabase.storage.from_(CLIPS_BUCKET).get_public_url(storage_path)

    insert_resp = (
        supabase.table("clips")
        .insert(
            {
                "user_id": user_id,
                "movie_id": movie_id,
                "video_url": public_url,
                "caption": caption,
                "city": city,
            }
        )
        .execute()
    )

    return insert_resp.data[0]
