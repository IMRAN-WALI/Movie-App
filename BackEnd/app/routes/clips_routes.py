from flask import Blueprint, jsonify, g, request
from app.utils.auth_middleware import require_auth
from app.utils.error_handlers import api_error
from app.services.clip_service import upload_clip

clips_bp = Blueprint("clips", __name__)

ALLOWED_EXTENSIONS = {"mp4", "mov", "m4v"}


def _allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[-1].lower() in ALLOWED_EXTENSIONS


@clips_bp.post("/upload")
@require_auth
def upload():
    if "file" not in request.files:
        return api_error("No file part named 'file' in the request", 400)

    file_storage = request.files["file"]
    if file_storage.filename == "":
        return api_error("No file selected", 400)

    if not _allowed_file(file_storage.filename):
        return api_error("Only .mp4, .mov, and .m4v clips are supported", 400)

    movie_id = request.form.get("movie_id")
    caption = request.form.get("caption")
    city = request.form.get("city")

    if not movie_id:
        return api_error("movie_id is required", 400)

    try:
        clip = upload_clip(
            user_id=g.user_id,
            movie_id=movie_id,
            caption=caption,
            city=city,
            file_storage=file_storage,
        )
        return jsonify(clip), 201
    except Exception as e:
        return api_error(f"Failed to upload clip: {str(e)}", 500)
