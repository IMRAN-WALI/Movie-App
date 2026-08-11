# BackEnd/app/utils/__init__.py
from app.utils.auth_middleware import require_auth, optional_auth
from app.utils.error_handlers import api_error, register_error_handlers, handle_exception
from app.utils.storage import (
    upload_to_storage,
    delete_from_storage,
    get_public_url,
    generate_storage_path,
    get_file_extension,
    is_allowed_file,
    CLIPS_BUCKET,
    MOVIES_BUCKET,
    AVATARS_BUCKET
)

__all__ = [
    # Auth
    'require_auth',
    'optional_auth',
    
    # Error Handlers
    'api_error',
    'register_error_handlers',
    'handle_exception',
    
    # Storage
    'upload_to_storage',
    'delete_from_storage',
    'get_public_url',
    'generate_storage_path',
    'get_file_extension',
    'is_allowed_file',
    'CLIPS_BUCKET',
    'MOVIES_BUCKET',
    'AVATARS_BUCKET'
]