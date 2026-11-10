import os
import bcrypt
from app.database import SessionLocal
from app.models.user import User


def main() -> None:
    email = os.getenv("ADMIN_EMAIL", "melkamuenyew90@gmail.com").strip().lower()
    username = os.getenv("ADMIN_USERNAME", "melkamu").strip().lower()
    password = os.getenv("ADMIN_PASSWORD", "Melkamu123@")

    if not email or not username or not password:
        raise SystemExit("Set ADMIN_EMAIL, ADMIN_USERNAME, and ADMIN_PASSWORD environment variables.")
    if len(password) < 8:
        raise SystemExit("ADMIN_PASSWORD must contain at least 8 characters.")

    db = SessionLocal()
    try:
        user = db.query(User).filter((User.email == email) | (User.username == username)).first()
        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        if user:
            user.email = email
            user.username = username
            user.hashed_password = hashed_password
        else:
            user = User(
                email=email,
                username=username,
                full_name="Administrator",
                hashed_password=hashed_password,
                phone="0911000000"
            )
            db.add(user)

        user.role_type = "admin"
        user.status = "active"
        user.is_active = True
        user.is_verified = True
        user.is_activated = True
        user.can_create_listings = True
        user.payment_approved = True
        db.commit()
        print(f"Admin credentials assigned in the configured database for {email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
