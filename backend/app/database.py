# backend/app/database.py
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("⚠️ WARNING: DATABASE_URL not found in .env file")
    print("📁 Using SQLite as fallback")
    DATABASE_URL = "sqlite:///./realestate.db"

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

engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,
    pool_pre_ping=True,
    echo=False,
    connect_args={
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5
    } if "postgresql" in DATABASE_URL else {"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
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
    return DATABASE_URL

def seed_admin_user():
    """Ensure the default administrator exists and is active with required credentials."""
    try:
        import bcrypt
        from .models.user import User

        admin_email = os.getenv("ADMIN_EMAIL", "melkamuenyew90@gmail.com").strip().lower()
        admin_username = os.getenv("ADMIN_USERNAME", "melkamu").strip().lower()
        admin_password = os.getenv("ADMIN_PASSWORD", "Melkamu123@")

        db = SessionLocal()
        try:
            user = db.query(User).filter((User.email == admin_email) | (User.username == admin_username)).first()
            hashed_password = bcrypt.hashpw(admin_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

            if user:
                user.email = admin_email
                user.username = admin_username
                user.hashed_password = hashed_password
                user.role_type = "admin"
                user.status = "active"
                user.is_active = True
                user.is_verified = True
                user.is_activated = True
                user.can_create_listings = True
                user.payment_approved = True
                db.commit()
                print(f"✅ Admin account synchronized: {admin_email}")
            else:
                new_admin = User(
                    email=admin_email,
                    username=admin_username,
                    full_name="Administrator",
                    hashed_password=hashed_password,
                    role_type="admin",
                    status="active",
                    is_active=True,
                    is_verified=True,
                    is_activated=True,
                    can_create_listings=True,
                    payment_approved=True,
                    phone="0911000000",
                )
                db.add(new_admin)
                db.commit()
                print(f"✅ Admin account initialized: {admin_email}")
        finally:
            db.close()
    except Exception as e:
        print(f"⚠️ Warning: Failed to seed admin user: {e}")

def init_db():
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created/verified")
        seed_admin_user()
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        raise