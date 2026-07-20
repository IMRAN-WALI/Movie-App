from flask import Blueprint, jsonify, g
from app.utils.auth_middleware import require_auth

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/verify")
@require_auth
def verify_token():
    return jsonify({"user_id": g.user_id, "email": g.user.email}), 200
