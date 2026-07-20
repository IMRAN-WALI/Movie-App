from flask import Blueprint, jsonify, g, request
from app.utils.auth_middleware import require_auth
from app.utils.error_handlers import api_error
from app.services.party_service import create_party, sync_party

party_bp = Blueprint("party", __name__)


@party_bp.post("/create")
@require_auth
def create():
    body = request.get_json(silent=True) or {}
    movie_id = body.get("movie_id")

    if not movie_id:
        return api_error("movie_id is required", 400)

    try:
        party = create_party(host_id=g.user_id, movie_id=movie_id)
        return jsonify(party), 201
    except Exception as e:
        return api_error(f"Failed to create party: {str(e)}", 500)


@party_bp.post("/sync")
@require_auth
def sync():
    body = request.get_json(silent=True) or {}
    party_id = body.get("party_id")
    current_time = body.get("current_time")

    if not party_id or current_time is None:
        return api_error("party_id and current_time are required", 400)

    try:
        updated = sync_party(
            party_id=party_id, user_id=g.user_id, current_time=current_time
        )
        return jsonify(updated), 200
    except PermissionError as e:
        return api_error(str(e), 403)
    except ValueError as e:
        return api_error(str(e), 404)
    except Exception as e:
        return api_error(f"Failed to sync party: {str(e)}", 500)
