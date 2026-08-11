# BackEnd/app/routes/party_routes.py
from flask import Blueprint, jsonify, g, request
from app.utils.auth_middleware import require_auth
from app.utils.error_handlers import api_error
from app.services.party_service import (
    create_party, 
    sync_party, 
    join_party, 
    leave_party,
    get_party_participants,
    get_party_by_invite_code
)
from app.extensions import supabase

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

@party_bp.post("/join")
@require_auth
def join():
    body = request.get_json(silent=True) or {}
    party_id = body.get("party_id")
    invite_code = body.get("invite_code")

    if not party_id and not invite_code:
        return api_error("party_id or invite_code is required", 400)

    try:
        if invite_code:
            party = get_party_by_invite_code(invite_code)
            if not party:
                return api_error("Invalid invite code", 404)
            party_id = party["id"]
        
        party = join_party(party_id, g.user_id)
        return jsonify(party), 200
    except ValueError as e:
        return api_error(str(e), 404)
    except Exception as e:
        return api_error(f"Failed to join party: {str(e)}", 500)

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
            party_id=party_id, 
            user_id=g.user_id, 
            current_time=current_time
        )
        return jsonify(updated), 200
    except PermissionError as e:
        return api_error(str(e), 403)
    except ValueError as e:
        return api_error(str(e), 404)
    except Exception as e:
        return api_error(f"Failed to sync party: {str(e)}", 500)

@party_bp.get("/<string:party_id>/participants")
@require_auth
def participants(party_id):
    try:
        participants = get_party_participants(party_id)
        return jsonify({"participants": participants}), 200
    except Exception as e:
        return api_error(f"Failed to get participants: {str(e)}", 500)

@party_bp.post("/<string:party_id>/leave")
@require_auth
def leave(party_id):
    try:
        leave_party(party_id, g.user_id)
        return jsonify({"message": "Left party successfully"}), 200
    except Exception as e:
        return api_error(f"Failed to leave party: {str(e)}", 500)

@party_bp.get("/<string:party_id>")
@require_auth
def get_party(party_id):
    try:
        response = supabase.table("watch_parties") \
            .select("*") \
            .eq("id", party_id) \
            .single() \
            .execute()
        if not response.data:
            return api_error("Party not found", 404)
        return jsonify(response.data), 200
    except Exception as e:
        return api_error(f"Failed to get party: {str(e)}", 500)