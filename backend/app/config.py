import os
from pydantic_settings import BaseSettings
from typing import List

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "smart_store.db").replace("\\", "/")

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Store Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database settings
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/smart_store"
    SQLITE_FALLBACK_URL: str = f"sqlite:///{DB_PATH}"
    USE_SQLITE_FALLBACK: bool = True
    
    # Security
    SECRET_KEY: str = "smart_store_super_secret_jwt_key_2026_9dfd564c"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Uploads
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads", "products")
    MAX_UPLOAD_SIZE_MB: int = 5
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    
    # Store Profile defaults
    STORE_NAME: str = "House of DNA"
    STORE_CURRENCY: str = "INR"
    STORE_CURRENCY_SYMBOL: str = "₹"
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
