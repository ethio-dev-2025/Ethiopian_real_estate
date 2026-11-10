# backend/create_remote_admin.py
import os
import bcrypt
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Load environment variables from .env (which should have your Neon DATABASE_URL)
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ ERROR: DATABASE_URL not found in .env file.")
    exit(1)

print(f"🔌 Connecting to database...")
# Create the engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Import your models
from app.models.user import User

# ==========================================
# ADMIN CREDENTIALS
# ==========================================
ADMIN_EMAIL = "melkamuenyew90@gmail.com"
ADMIN_PASSWORD = "Melkamu123@"
ADMIN_USERNAME = "admin" # Change this if you prefer a different username
ADMIN_NAME = "System Admin"

# 1. Hash the password using raw bcrypt (matching your auth.py logic)
salt = bcrypt.gensalt()
hashed_password = bcrypt.hashpw(ADMIN_PASSWORD.encode('utf-8'), salt).decode('utf-8')

try:
    # 2. Check if the user already exists
    existing_user = db.query(User).filter(User.email == ADMIN_EMAIL).first()

    if existing_user:
        print(f"⚠️ User with email {ADMIN_EMAIL} already exists.")
        print(f"🔄 Updating password and ensuring admin role...")
        
        existing_user.hashed_password = hashed_password
        existing_user.role_type = "admin"
        existing_user.status = "active"
        existing_user.is_active = True
        existing_user.is_verified = True
        existing_user.is_activated = True
        existing_user.can_create_listings = True
        existing_user.payment_approved = True
        
        db.commit()
        print("✅ Admin password updated and role confirmed!")
        
    else:
        print(f"🆕 Creating new admin user for {ADMIN_EMAIL}...")
        
        # Check if username is taken
        username_check = db.query(User).filter(User.username == ADMIN_USERNAME).first()
        if username_check:
            print(f"❌ Error: Username '{ADMIN_USERNAME}' is already taken by another user.")
            print("Please change the ADMIN_USERNAME in this script and try again.")
            exit(1)

        new_admin = User(
            email=ADMIN_EMAIL,
            username=ADMIN_USERNAME,
            full_name=ADMIN_NAME,
            hashed_password=hashed_password,
            phone="",
            role_type="admin",
            status="active",
            is_active=True,
            is_verified=True,
            is_activated=True,
            can_create_listings=True,
            payment_approved=True
        )
        
        db.add(new_admin)
        db.commit()
        print("✅ New admin user successfully created in the remote database!")
        
except Exception as e:
    print(f"❌ An error occurred: {e}")
    db.rollback()
finally:
    db.close()
    print("🔌 Database connection closed.")