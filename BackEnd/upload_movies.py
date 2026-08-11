# BackEnd/upload_videos.py
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def upload_all():
    folder = "./movies"
    files = [f for f in os.listdir(folder) if f.startswith("movie_") and f.endswith(".mp4")]
    
    for filename in files:
        filepath = os.path.join(folder, filename)
        print(f"📤 Uploading: {filename}")
        
        with open(filepath, "rb") as f:
            supabase.storage.from_("videos").upload(
                filename,
                f.read(),
                {"content-type": "video/mp4"}
            )
        print(f"✅ Uploaded: {filename}")

if __name__ == "__main__":
    upload_all()