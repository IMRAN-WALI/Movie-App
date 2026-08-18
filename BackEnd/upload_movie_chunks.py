import os
import sys
import time
import logging
from pathlib import Path
from typing import Dict, List, Optional
from dotenv import load_dotenv
from supabase import create_client, Client
from tqdm import tqdm

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
BUCKET_NAME = "full-movies"
CHUNK_SIZE = 50 * 1024 * 1024  # 50 MB

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MovieUploader:
    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.bucket = BUCKET_NAME
        
    def get_movie_record(self, movie_id: int) -> Optional[Dict]:
        try:
            response = self.supabase.table("movies")\
                .select("id, title, movie_file_name, file_size, chunk_count, video_url")\
                .eq("id", movie_id)\
                .execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error fetching movie: {e}")
            return None
    
    def get_existing_chunks(self, movie_id: int) -> List[int]:
        try:
            response = self.supabase.table("movie_chunks")\
                .select("chunk_index")\
                .eq("movie_id", movie_id)\
                .order("chunk_index")\
                .execute()
            return [chunk["chunk_index"] for chunk in response.data]
        except Exception as e:
            logger.error(f"Error fetching chunks: {e}")
            return []
    
    def upload_chunk(self, movie_id: int, chunk_index: int, chunk_data: bytes) -> bool:
        try:
            storage_path = f"movies/{movie_id}/chunk_{chunk_index:06d}.part"
            
            self.supabase.storage.from_(self.bucket).upload(
                path=storage_path,
                file=chunk_data,
                file_options={"content-type": "application/octet-stream"}
            )
            
            self.supabase.table("movie_chunks").insert({
                "movie_id": movie_id,
                "chunk_index": chunk_index,
                "storage_path": storage_path,
                "chunk_size": len(chunk_data)
            }).execute()
            
            return True
        except Exception as e:
            logger.error(f"Error uploading chunk {chunk_index}: {e}")
            return False
    
    def update_movie_metadata(self, movie_id: int, file_path: Path, total_chunks: int, source_url: str = ""):
        file_size = file_path.stat().st_size
        file_name = file_path.name
        
        try:
            self.supabase.table("movies").update({
                "video_url": None,
                "movie_storage_path": f"movies/{movie_id}/",
                "video_type": "full_movie",
                "downloadable": True,
                "chunk_count": total_chunks,
                "chunk_size": CHUNK_SIZE,
                "file_size": file_size,
                "movie_file_name": file_name,
                "source_type": "internet_archive" if source_url else None,
                "source_video_url": source_url if source_url else None
            }).eq("id", movie_id).execute()
            
            logger.info(f"✅ Movie metadata updated for ID: {movie_id}")
            return True
        except Exception as e:
            logger.error(f"Error updating movie metadata: {e}")
            return False
    
    def verify_chunks(self, movie_id: int, total_chunks: int) -> bool:
        existing = self.get_existing_chunks(movie_id)
        missing = set(range(total_chunks)) - set(existing)
        if missing:
            logger.warning(f"Missing chunks: {sorted(missing)}")
            return False
        return True
    
    def upload_movie(self, file_path: str, movie_id: int, source_url: str = ""):
        file_path = Path(file_path)
        if not file_path.exists():
            logger.error(f"File not found: {file_path}")
            return False
        
        movie = self.get_movie_record(movie_id)
        if not movie:
            logger.error(f"Movie ID {movie_id} not found in database")
            return False
        
        logger.info(f"📽️  Uploading: {movie['title']}")
        logger.info(f"📁 File: {file_path.name} ({file_path.stat().st_size / (1024**3):.2f} GB)")
        
        existing_chunks = self.get_existing_chunks(movie_id)
        total_chunks = (file_path.stat().st_size + CHUNK_SIZE - 1) // CHUNK_SIZE
        
        logger.info(f"🧩 Total chunks: {total_chunks}")
        logger.info(f"✅ Already uploaded: {len(existing_chunks)} chunks")
        
        if len(existing_chunks) == total_chunks and self.verify_chunks(movie_id, total_chunks):
            logger.info("✅ All chunks already uploaded!")
            self.update_movie_metadata(movie_id, file_path, total_chunks, source_url)
            return True
        
        with open(file_path, "rb") as f:
            with tqdm(total=total_chunks, desc="Uploading chunks", unit="chunk") as pbar:
                pbar.update(len(existing_chunks))
                
                for chunk_index in range(total_chunks):
                    if chunk_index in existing_chunks:
                        continue
                    
                    f.seek(chunk_index * CHUNK_SIZE)
                    chunk_data = f.read(CHUNK_SIZE)
                    
                    if not self.upload_chunk(movie_id, chunk_index, chunk_data):
                        logger.error(f"Failed to upload chunk {chunk_index}")
                        return False
                    
                    pbar.update(1)
                    time.sleep(0.1)
        
        if self.verify_chunks(movie_id, total_chunks):
            logger.info("✅ All chunks uploaded successfully!")
            self.update_movie_metadata(movie_id, file_path, total_chunks, source_url)
            return True
        else:
            logger.error("❌ Upload incomplete or corrupted")
            return False

def main():
    if len(sys.argv) < 3:
        print("Usage: python upload_movie_chunks.py <video_file_path> <movie_id> [source_url]")
        print("Example: python upload_movie_chunks.py the-odyssey.mp4 1 https://archive.org/download/the-odyssey")
        sys.exit(1)
    
    file_path = sys.argv[1]
    movie_id = int(sys.argv[2])
    source_url = sys.argv[3] if len(sys.argv) > 3 else ""
    
    uploader = MovieUploader()
    success = uploader.upload_movie(file_path, movie_id, source_url)
    
    if success:
        logger.info("🎉 Movie upload completed successfully!")
    else:
        logger.error("❌ Movie upload failed!")

if __name__ == "__main__":
    main()