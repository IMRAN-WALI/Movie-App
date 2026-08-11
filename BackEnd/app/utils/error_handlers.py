# BackEnd/app/utils/error_handlers.py
from flask import jsonify

def api_error(message, status=400, details=None):
    """
    Return a standardized API error response
    
    Args:
        message: Error message string
        status: HTTP status code (default: 400)
        details: Optional additional error details
    
    Returns:
        Tuple of (JSON response, status code)
    """
    payload = {"error": message}
    if details:
        payload["details"] = details
    return jsonify(payload), status


def register_error_handlers(app):
    """Register global error handlers for Flask app"""
    
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500
    
    @app.errorhandler(413)
    def request_entity_too_large(e):
        return jsonify({"error": "File too large. Maximum size is 500MB"}), 413
    
    @app.errorhandler(429)
    def rate_limit_exceeded(e):
        return jsonify({"error": "Too many requests. Please try again later"}), 429
    
    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"error": "Unauthorized"}), 401
    
    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "Forbidden"}), 403


def handle_exception(e, default_message="Something went wrong", default_status=500):
    """
    Handle exceptions and return standardized error response
    
    Args:
        e: Exception object
        default_message: Fallback error message
        default_status: Fallback HTTP status code
    
    Returns:
        Tuple of (JSON response, status code)
    """
    error_message = str(e) if str(e) else default_message
    return api_error(error_message, default_status)