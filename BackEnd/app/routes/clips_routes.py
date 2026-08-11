# BackEnd/app/routes/clips_routes.py
from flask import Blueprint, jsonify, g, request
from app.utils.auth_middleware import require_auth
from app.utils.error_handlers import api_error
from app.services.clip_service import upload_clip, get_user_clips, delete_clip, get_clip_feed, toggle_like

clips_bp = Blueprint("clips", __name__)

ALLOWED_EXTENSIONS = {"mp4", "mov", "m4v", "avi", "mkv"}


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
        return api_error("Only .mp4, .mov, .m4v, .avi, .mkv clips are supported", 400)

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

@clips_bp.get("/my")
@require_auth
def my_clips():
    try:
        clips = get_user_clips(g.user_id)
        return jsonify({"clips": clips}), 200
    except Exception as e:
        return api_error(f"Failed to fetch clips: {str(e)}", 500)

@clips_bp.delete("/<string:clip_id>")
@require_auth
def delete(clip_id):
    try:
        delete_clip(clip_id, g.user_id)
        return jsonify({"message": "Clip deleted successfully"}), 200
    except Exception as e:
        return api_error(f"Failed to delete clip: {str(e)}", 500)

@clips_bp.get("/feed")
@require_auth
def feed():
    try:
        limit = request.args.get("limit", 10, type=int)
        offset = request.args.get("offset", 0, type=int)
        clips = get_clip_feed(limit, offset)
        return jsonify({"clips": clips}), 200
    except Exception as e:
        return api_error(f"Failed to fetch feed: {str(e)}", 500)

@clips_bp.post("/<string:clip_id>/like")
@require_auth
def like(clip_id):
    try:
        result = toggle_like(clip_id, g.user_id)
        return jsonify(result), 200
    except Exception as e:
        return api_error(f"Failed to toggle like: {str(e)}", 500)