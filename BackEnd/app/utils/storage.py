# BackEnd/app/utils/storage.py
import os
import uuid
from datetime import datetime
from app.supabase_client import get_supabase

CLIPS_BUCKET = "clips"
MOVIES_BUCKET = "videos"
AVATARS_BUCKET = "avatars"

def upload_to_storage(file_storage, filename, bucket=CLIPS_BUCKET):
    """Upload file to Supabase Storage"""
    try:
        supabase = get_supabase()
        
        # Read file content
        file_content = file_storage.read()
        
        # Ensure bucket exists
        try:
            supabase.storage.create_bucket(bucket, {"public": True})
        except Exception:
            pass  # Bucket already exists
        
        # Upload to Supabase Storage
        response = supabase.storage.from_(bucket).upload(
            filename, 
            file_content,
            {"content-type": file_storage.content_type or "video/mp4"}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(bucket).get_public_url(filename)
        
        return public_url
        
    except Exception as e:
        print(f"❌ upload_to_storage error: {e}")
        raise e

def delete_from_storage(filename, bucket=CLIPS_BUCKET):
    """Delete file from Supabase Storage"""
    try:
        supabase = get_supabase()
        supabase.storage.from_(bucket).remove([filename])
        return True
    except Exception as e:
        print(f"❌ delete_from_storage error: {e}")
        return False

def get_public_url(filename, bucket=CLIPS_BUCKET):
    """Get public URL for a file"""
    try:
        supabase = get_supabase()
        return supabase.storage.from_(bucket).get_public_url(filename)
    except Exception as e:
        print(f"❌ get_public_url error: {e}")
        return None

def generate_storage_path(user_id, filename, prefix="clips"):
    """Generate a unique storage path"""
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "mp4"
    unique_id = uuid.uuid4().hex[:8]
    return f"{prefix}/{user_id}/{timestamp}_{unique_id}.{ext}"

def get_file_extension(filename):
    """Get file extension from filename"""
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

def is_allowed_file(filename, allowed_extensions=None):
    """Check if file extension is allowed"""
    if allowed_extensions is None:
        allowed_extensions = {"mp4", "mov", "m4v", "avi", "mkv", "jpg", "jpeg", "png", "gif"}
    ext = get_file_extension(filename)
    return ext in allowed_extensions