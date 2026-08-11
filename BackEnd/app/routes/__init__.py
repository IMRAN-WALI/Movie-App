# BackEnd/app/routes/__init__.py
from app.routes.auth_routes import auth_bp
from app.routes.movies_routes import movies_bp
from app.routes.clips_routes import clips_bp
from app.routes.party_routes import party_bp
from app.routes.ai_routes import ai_bp

__all__ = ['auth_bp', 'movies_bp', 'clips_bp', 'party_bp', 'ai_bp']