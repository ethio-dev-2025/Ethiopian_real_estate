# backend/app/database.py
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

# ✅ Load .env ONLY if it exists (local dev), but never override Render env vars
load_dotenv(override=False)

# ✅ Priority: Render env var > .env file > sqlite fallback
DATABASE_URL = os.getenv("DATABASE_URL")

# ✅ CRITICAL: Reject localhost/127.0.0.1 in production
if DATABASE_URL and ("127.0.0.1" in DATABASE_URL or "localhost" in DATABASE_URL):
    print("❌ REJECTED: DATABASE_URL points to localhost — forcing Neon override")
    DATABASE_URL = os.environ.get("DATABASE_URL_FALLBACK", None)

if not DATABASE_URL:
    print("⚠️ WARNING: DATABASE_URL not found — using SQLite fallback")
    DATABASE_URL = "sqlite:///./realestate.db"

print(f"🔗 Database host: {DATABASE_URL.split('@')[-1].split('/')[0] if '@' in DATABASE_URL else DATABASE_URL}")

if "neon.tech" in DATABASE_URL:
    if "sslmode" not in DATABASE_URL:
        if "?" in DATABASE_URL:
            DATABASE_URL = DATABASE_URL + "&sslmode=require"
        else:
            DATABASE_URL = DATABASE_URL + "?sslmode=require"
    if "connect_timeout" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL + "&connect_timeout=10"
    print("🔗 Connected to Neon PostgreSQL")

print(f"✅ Database configured")