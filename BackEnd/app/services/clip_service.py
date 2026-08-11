import uuid
from datetime import datetime
from werkzeug.utils import secure_filename
from app.supabase_client import get_supabase  # ✅ Correct import

CLIPS_BUCKET = "clips"

def upload_clip(user_id, movie_id, caption, city, file_storage):
    """Upload a clip to Supabase"""
    try:
        supabase = get_supabase()  # ✅ Use supabase_client
        
        # Generate unique filename
        filename = secure_filename(file_storage.filename or "clip.mp4")
        ext = filename.rsplit(".", 1)[-1] if "." in filename else "mp4"
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        storage_path = f"{user_id}/{timestamp}_{uuid.uuid4().hex[:8]}.{ext}"
        
        # Upload to storage
        file_bytes = file_storage.read()
        supabase.storage.from_(CLIPS_BUCKET).upload(
            storage_path,
            file_bytes,
            {"content-type": file_storage.mimetype or "video/mp4"}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(CLIPS_BUCKET).get_public_url(storage_path)
        
        # Save to database
        clip_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "movie_id": int(movie_id),
            "video_url": public_url,
            "title": caption or "Untitled Clip",
            "status": "ready",
            "created_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("clips").insert(clip_data).execute()
        return response.data[0] if response.data else clip_data
        
    except Exception as e:
        print(f"❌ upload_clip error: {e}")
        raise e
    
    """Upload a clip to Supabase Storage"""
    supabase = get_supabase()
    
    # Secure filename
    filename = secure_filename(file_storage.filename or "clip.mp4")
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "mp4"
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    storage_path = f"{user_id}/{timestamp}_{uuid.uuid4().hex[:8]}.{ext}"
    
    # Read file
    file_bytes = file_storage.read()
    
    # Upload to Supabase Storage
    supabase.storage.from_(CLIPS_BUCKET).upload(
        storage_path,
        file_bytes,
        {"content-type": file_storage.mimetype or "video/mp4"},
    )
    
    # Get public URL
    public_url = supabase.storage.from_(CLIPS_BUCKET).get_public_url(storage_path)
    
    # Insert into database
    clip_id = str(uuid.uuid4())
    insert_resp = (
        supabase.table("clips")
        .insert(
            {
                "id": clip_id,
                "user_id": user_id,
                "movie_id": int(movie_id),
                "video_url": public_url,
                "title": caption or "Untitled Clip",
                "caption": caption,
                "city": city,
                "status": "ready",
                "created_at": datetime.utcnow().isoformat()
            }
        )
        .execute()
    )
    
    return insert_resp.data[0] if insert_resp.data else {"id": clip_id, "video_url": public_url}

def get_user_clips(user_id):
    """Get all clips by a user"""
    supabase = get_supabase()
    resp = (
        supabase.table("clips")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data or []

def delete_clip(clip_id, user_id):
    """Delete a clip"""
    supabase = get_supabase()
    
    # Get clip first
    clip_resp = (
        supabase.table("clips")
        .select("video_url")
        .eq("id", clip_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    
    if clip_resp.data:
        # Delete from storage
        video_url = clip_resp.data.get("video_url", "")
        if video_url:
            # Extract storage path from URL
            try:
                storage_path = video_url.split("/clips/")[-1].split("?")[0]
                supabase.storage.from_(CLIPS_BUCKET).remove([storage_path])
            except Exception as e:
                print(f"⚠️ Could not delete from storage: {e}")
    
    # Delete from database
    supabase.table("clips").delete().eq("id", clip_id).eq("user_id", user_id).execute()
    return True

def get_clip_feed(limit=10, offset=0):
    """Get public clip feed"""
    supabase = get_supabase()
    resp = (
        supabase.table("clips")
        .select("*, profiles!inner(display_name, avatar_url)")
        .eq("status", "ready")
        .order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute()
    )
    return resp.data or []

def toggle_like(clip_id, user_id):
    """Toggle like on a clip"""
    supabase = get_supabase()
    
    # Check if already liked
    existing = (
        supabase.table("clip_likes")
        .select("*")
        .eq("clip_id", clip_id)
        .eq("user_id", user_id)
        .execute()
    )
    
    if existing.data:
        # Unlike
        supabase.table("clip_likes").delete().eq("clip_id", clip_id).eq("user_id", user_id).execute()
        return {"liked": False, "message": "Unliked"}
    else:
        # Like
        supabase.table("clip_likes").insert({"clip_id": clip_id, "user_id": user_id}).execute()
        return {"liked": True, "message": "Liked"}