from functools import wraps
from flask import request, jsonify
import os
from supabase import create_client

# Initialize Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Initialize only if keys exist
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

def require_auth(f):
    """
    Decorator to require authentication for routes.
    Usage: @require_auth
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Skip auth if no supabase configured (development)
        if not supabase:
            return f(*args, **kwargs)
        
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({"error": "Missing authorization header"}), 401
        
        try:
            # Extract token
            token = auth_header.replace('Bearer ', '')
            
            # Verify token with Supabase
            user = supabase.auth.get_user(token)
            
            if not user or not user.user:
                return jsonify({"error": "Invalid or expired token"}), 401
            
            # Add user to request context
            request.user = user.user
            
            return f(*args, **kwargs)
            
        except Exception as e:
            print(f"🔐 Auth error: {e}")
            return jsonify({"error": "Authentication failed"}), 401
    
    return decorated_function

def optional_auth(f):
    """
    Decorator for optional authentication.
    If token provided and valid, user will be set in request.user
    Otherwise, request.user remains None
    Usage: @optional_auth
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Default no user
        request.user = None
        
        # Skip if no supabase configured
        if not supabase:
            return f(*args, **kwargs)
        
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.replace('Bearer ', '')
                user = supabase.auth.get_user(token)
                if user and user.user:
                    request.user = user.user
            except Exception as e:
                # Token invalid but that's fine for optional auth
                print(f"🔓 Optional auth failed: {e}")
                pass
        
        return f(*args, **kwargs)
    
    return decorated_function

def get_current_user():
    """
    Get current authenticated user from request context.
    Returns None if no user is authenticated.
    """
    return getattr(request, 'user', None)

def get_user_id():
    """
    Get current user ID from request context.
    Returns None if no user is authenticated.
    """
    user = get_current_user()
    return user.id if user else None