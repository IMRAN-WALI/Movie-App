# BackEnd/run.py
from app import create_app
import os

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    
    # Get debug mode from env
    debug = os.getenv("FLASK_ENV", "production") == "development"
    
    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug,
        use_reloader=debug,  # Enable reloader only in debug
        threaded=True,
    )