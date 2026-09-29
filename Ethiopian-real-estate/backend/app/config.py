# backend/app/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    APP_NAME = os.getenv("APP_NAME", "RealEstate Pro API")
    DEBUG = os.getenv("DEBUG", "False") == "True"
    
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    # JWT
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "43200"))
    
    # Chapa Payment
    CHAPA_SECRET_KEY = os.getenv("CHAPA_SECRET_KEY", "")
    CHAPA_WEBHOOK_SECRET = os.getenv("CHAPA_WEBHOOK_SECRET", "")
    
    # Google OAuth
    GOOGLE_CLIENT_ID = os.getenv("VITE_GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET = os.getenv("VITE_GOOGLE_CLIENT_SECRET", "")
    
    # SMTP Email Settings
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "EstateHub")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "True").lower() == "true"
    SMTP_USE_SSL: bool = os.getenv("SMTP_USE_SSL", "False").lower() == "true"
    
    # Frontend URL
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    BASE_URL: str = os.getenv("BASE_URL", "http://localhost:8000")

settings = Settings()

# Print configuration status on startup
print("=" * 50)
print("🔧 CONFIGURATION STATUS")
print("=" * 50)
print(f"✅ App Name: {settings.APP_NAME}")
print(f"✅ Debug Mode: {settings.DEBUG}")
print(f"✅ Database: {'Connected' if settings.DATABASE_URL else 'Not Configured'}")
print(f"✅ Google OAuth: {'Configured' if settings.GOOGLE_CLIENT_ID else 'Not Configured'}")
print(f"✅ SMTP Email: {'Configured' if settings.SMTP_USER else 'Not Configured'}")
print(f"   📧 From: {settings.SMTP_FROM_EMAIL}")
print(f"   📧 Host: {settings.SMTP_HOST}:{settings.SMTP_PORT}")
print("=" * 50)