from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("⚠️ WARNING: DATABASE_URL not found in .env file")
    print("📁 Using SQLite as fallback")
    DATABASE_URL = "sqlite:///./realestate.db"

# Format Neon PostgreSQL URL properly
if "neon.tech" in DATABASE_URL:
    if "sslmode" not in DATABASE_URL:
        if "?" in DATABASE_URL:
            DATABASE_URL = DATABASE_URL + "&sslmode=require"
        else:
            DATABASE_URL = DATABASE_URL + "?sslmode=require"
    # Also add connection timeout
    if "connect_timeout" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL + "&connect_timeout=10"
    print("🔗 Connected to Neon PostgreSQL")

print(f"✅ Database configured")

# Use NullPool to avoid connection pooling issues
# Reduce pool size and add proper connection parameters
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,  # No connection pooling - each connection is closed after use
    pool_pre_ping=True,   # Verify connections before using
    echo=False,
    connect_args={
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5
    } if "postgresql" in DATABASE_URL else {"check_same_thread": False}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

def get_db():
    """Get database session with automatic cleanup."""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        print(f"Database error: {e}")
        raise
    finally:
        db.close()

def get_database_url():
    """Return the database URL (for debugging)"""
    return DATABASE_URL

def init_db():
    """Create all tables if they don't exist"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created/verified")
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        raise