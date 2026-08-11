# BackEnd/upload_all_movies.py
import os
from supabase import create_client
from dotenv import load_dotenv
import time

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def upload_all_movies():
    """Upload all movies to Supabase Storage"""
    movies_folder = "./movies"
    
    if not os.path.exists(movies_folder):
        print(f"❌ Folder not found: {movies_folder}")
        return
    
    # Get all movie files
    files = [f for f in os.listdir(movies_folder) 
             if f.startswith("movie_") and f.endswith(".mp4")]
    
    if not files:
        print("❌ No movie files found!")
        return
    
    print(f"📤 Found {len(files)} movies to upload")
    print("=" * 60)
    
    uploaded = 0
    failed = 0
    
    for filename in sorted(files):
        filepath = os.path.join(movies_folder, filename)
        file_size = os.path.getsize(filepath) / (1024 * 1024)  # MB
        
        print(f"📤 Uploading: {filename} ({file_size:.1f} MB)")
        
        try:
            with open(filepath, "rb") as f:
                # Upload to Supabase Storage
                supabase.storage.from_("videos").upload(
                    filename,
                    f.read(),
                    {"content-type": "video/mp4"}
                )
            print(f"✅ Uploaded: {filename}")
            uploaded += 1
            
        except Exception as e:
            if "Duplicate" in str(e) or "already exists" in str(e):
                print(f"⏭️ {filename} already exists - skipping")
                uploaded += 1
            else:
                print(f"❌ Failed: {filename} - {e}")
                failed += 1
        
        time.sleep(0.5)  # Small delay to avoid rate limiting
    
    print("=" * 60)
    print(f"📊 Upload Summary:")
    print(f"  ✅ Uploaded: {uploaded}")
    print(f"  ❌ Failed: {failed}")
    print("=" * 60)

if __name__ == "__main__":
    upload_all_movies()