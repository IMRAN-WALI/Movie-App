from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()


def create_app():
    app = Flask(__name__)

    cors_origins = os.getenv("CORS_ORIGINS", "*")
    CORS(app, resources={r"/api/*": {"origins": cors_origins.split(",")}})

    from app.routes.auth_routes import auth_bp
    from app.routes.movies_routes import movies_bp
    from app.routes.ai_routes import ai_bp
    from app.routes.party_routes import party_bp
    from app.routes.clips_routes import clips_bp
    from app.utils.error_handlers import register_error_handlers

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(movies_bp, url_prefix="/api/movies")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(party_bp, url_prefix="/api/party")
    app.register_blueprint(clips_bp, url_prefix="/api/clips")

    register_error_handlers(app)

    @app.get("/health")
    def health():
        return {"status": "ok"}, 200

    return app
