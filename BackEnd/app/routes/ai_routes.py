from flask import Blueprint, jsonify, g, request
from app.utils.auth_middleware import require_auth
from app.utils.error_handlers import api_error
from app.services.ai_service import recommend_movies
from app.services.taste_service import compute_taste_dna

ai_bp = Blueprint("ai", __name__)


@ai_bp.post("/recommend")
@require_auth
def recommend():
    body = request.get_json(silent=True) or {}
    user_id = body.get("user_id", g.user_id)

    if user_id != g.user_id:
        return api_error(
            "You can only request recommendations for your own account", 403
        )

    try:
        recommendations = recommend_movies(user_id)
        return jsonify({"user_id": user_id, "recommendations": recommendations}), 200
    except Exception as e:
        return api_error(f"Failed to generate recommendations: {str(e)}", 500)


@ai_bp.post("/taste-dna")
@require_auth
def taste_dna():
    body = request.get_json(silent=True) or {}
    user_id = body.get("user_id", g.user_id)

    if user_id != g.user_id:
        return api_error("You can only compute taste DNA for your own account", 403)

    try:
        result = compute_taste_dna(user_id)
        return jsonify(result), 200
    except Exception as e:
        return api_error(f"Failed to compute taste DNA: {str(e)}", 500)
