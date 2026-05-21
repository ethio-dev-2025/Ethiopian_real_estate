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
    
    # Email settings
    SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@realestatepro.com")

settings = Settings()

# Print configuration status on startup
print("=" * 50)
print("🔧 CONFIGURATION STATUS")
print("=" * 50)
print(f"✅ App Name: {settings.APP_NAME}")
print(f"✅ Debug Mode: {settings.DEBUG}")
print(f"✅ Google OAuth: {'Configured' if settings.GOOGLE_CLIENT_ID else 'Not Configured'}")
print("=" * 50)