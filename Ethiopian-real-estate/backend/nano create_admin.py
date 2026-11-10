# create_admin.py
"""
Run from backend root:
    python create_admin.py
"""

# ---- ADJUST THESE IMPORTS TO MATCH YOUR PROJECT ----
from database import SessionLocal          # your DB session factory
from models import User                    # your User model
from auth import get_password_hash         # your password hashing function
# -----------------------------------------------------

EMAIL = "melkamuenyew90@gmail.com"
PASSWORD = "Melkamu123@?"


def create_admin():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == EMAIL).first()

        if user:
            user.hashed_password = get_password_hash(PASSWORD)
            user.is_admin = True
            user.is_active = True
            db.commit()
            print(f"♻️  Updated existing user to admin: {EMAIL}")
        else:
            user = User(
                email=EMAIL,
                hashed_password=get_password_hash(PASSWORD),
                is_admin=True,
                is_active=True,
            )
            db.add(user)
            db.commit()
            print(f"✅ Admin created: {EMAIL}")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()