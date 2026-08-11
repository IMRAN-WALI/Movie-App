# BackEnd/app/routes/auth_routes.py
from flask import Blueprint, jsonify, g
from app.utils.auth_middleware import require_auth

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/verify")
@require_auth
def verify_token():
    return jsonify({"user_id": g.user_id, "email": g.user.email}), 200

@auth_bp.get("/me")
@require_auth
def get_me():
    """Get current user info"""
    return jsonify({
        "id": g.user_id,
        "email": g.user.email,
        "user_metadata": g.user.user_metadata
    }), 200