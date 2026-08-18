import io
import os

from dotenv import load_dotenv
from flask import Blueprint, Response, jsonify, request, stream_with_context

from supabase import create_client

load_dotenv()

download_bp = Blueprint('download', __name__, url_prefix='/api/download')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
BUCKET_NAME = "full-movies"

@download_bp.route('/movie/<int:movie_id>')
def download_full_movie(movie_id):
    """Stream full movie by merging all chunks"""
    try:
        # 1. Get movie metadata
        movie = supabase.table("movies")\
            .select("title, movie_storage_path, chunk_count, file_size")\
            .eq("id", movie_id)\
            .execute()
        
        if not movie.data:
            return jsonify({"error": "Movie not found"}), 404
        
        movie_data = movie.data[0]
        
        # 2. Get all chunks
        chunks = supabase.table("movie_chunks")\
            .select("storage_path, chunk_index")\
            .eq("movie_id", movie_id)\
            .order("chunk_index")\
            .execute()
        
        if not chunks.data:
            return jsonify({"error": "No chunks found"}), 404
        
        # 3. Stream chunks
        def generate():
            for chunk in chunks.data:
                # Download chunk from Supabase Storage
                response = supabase.storage.from_(BUCKET_NAME)\
                    .download(chunk["storage_path"])
                
                if response:
                    yield response
        
        # 4. Return streaming response
        return Response(
            stream_with_context(generate()),
            mimetype='video/mp4',
            headers={
                'Content-Disposition': f'attachment; filename="{movie_data["title"]}.mp4"',
                'Content-Length': str(movie_data.get("file_size", 0))
            }
        )
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@download_bp.route('/movie/<int:movie_id>/info')
def get_movie_download_info(movie_id):
    """Get movie download info"""
    try:
        movie = supabase.table("movies")\
            .select("id, title, file_size, chunk_count, movie_storage_path")\
            .eq("id", movie_id)\
            .execute()
        
        if not movie.data:
            return jsonify({"error": "Movie not found"}), 404
        
        return jsonify({
            "movieId": movie.data[0]["id"],
            "title": movie.data[0]["title"],
            "fileSize": movie.data[0].get("file_size", 0),
            "chunkCount": movie.data[0].get("chunk_count", 0),
            "downloadUrl": f"/api/download/movie/{movie_id}"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500