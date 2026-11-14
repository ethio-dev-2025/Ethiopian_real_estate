# backend/create_remote_admin.py
import bcrypt
from sqlalchemy import create_engine, text

# ✅ Neon database URL
NEON_DB_URL = "postgresql://neondb_owner:npg_bpX65nWGTUZN@ep-little-pine-bedmsd75-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

ADMIN_EMAIL = "melkamuenyew90@gmail.com"
ADMIN_PASSWORD = "Melkamu123@"
ADMIN_USERNAME = "melkamu"
ADMIN_FULL_NAME = "Melkamu Admin"

print("🔌 Connecting to Neon...")
engine = create_engine(NEON_DB_URL)

# Hash password
salt = bcrypt.gensalt()
hashed_password = bcrypt.hashpw(ADMIN_PASSWORD.encode("utf-8"), salt).decode("utf-8")
print(f"🔑 Password hashed successfully")

with engine.connect() as conn:
    # Check if admin exists
    existing = conn.execute(
        text("SELECT id, email, username FROM users WHERE email = :email OR username = :username LIMIT 1"),
        {"email": ADMIN_EMAIL, "username": ADMIN_USERNAME}
    ).first()

    if existing:
        print(f"🔄 User exists (id={existing[0]}), updating...")
        conn.execute(
            text("""
                UPDATE users
                SET email = :email,
                    username = :username,
                    full_name = :full_name,
                    hashed_password = :hashed_password,
                    role_type = 'admin',
                    status = 'active',
                    is_active = TRUE,
                    is_verified = TRUE,
                    is_activated = TRUE,
                    can_create_listings = TRUE,
                    payment_approved = TRUE,
                    has_active_subscription = TRUE
                WHERE id = :id
            """),
            {
                "id": existing[0],
                "email": ADMIN_EMAIL,
                "username": ADMIN_USERNAME,
                "full_name": ADMIN_FULL_NAME,
                "hashed_password": hashed_password,
            }
        )
        conn.commit()
        print(f"✅ Admin updated: {ADMIN_EMAIL}")
    else:
        print(f"🆕 Creating new admin user...")
        # Find max ID and add 1 (in case ID sequence is misaligned)
        max_id = conn.execute(text("SELECT COALESCE(MAX(id), 0) FROM users")).scalar()
        new_id = max_id + 1
        
        conn.execute(
            text("""
                INSERT INTO users (
                    id, email, username, full_name, hashed_password, phone,
                    role_type, status, is_active, is_verified, is_activated,
                    can_create_listings, payment_approved, has_active_subscription,
                    created_at
                )
                VALUES (
                    :id, :email, :username, :full_name, :hashed_password, :phone,
                    'admin', 'active', TRUE, TRUE, TRUE,
                    TRUE, TRUE, TRUE,
                    NOW()
                )
            """),
            {
                "id": new_id,
                "email": ADMIN_EMAIL,
                "username": ADMIN_USERNAME,
                "full_name": ADMIN_FULL_NAME,
                "hashed_password": hashed_password,
                "phone": "0911000000",
            }
        )
        conn.commit()
        print(f"✅ Admin created with id={new_id}: {ADMIN_EMAIL}")

    # Verify
    verify = conn.execute(
        text("SELECT id, email, role_type, status, hashed_password FROM users WHERE email = :email"),
        {"email": ADMIN_EMAIL}
    ).first()

    if verify:
        pwd_ok = bcrypt.checkpw(ADMIN_PASSWORD.encode("utf-8"), verify[4].encode("utf-8"))
        print(f"\n{'='*50}")
        print(f"✅ VERIFICATION:")
        print(f"   ID: {verify[0]}")
        print(f"   Email: {verify[1]}")
        print(f"   Role: {verify[2]}")
        print(f"   Status: {verify[3]}")
        print(f"   Password verified: {pwd_ok}")
        print(f"{'='*50}\n")
        
        if pwd_ok:
            print(f"🎉 LOGIN READY:")
            print(f"   Email: {ADMIN_EMAIL}")
            print(f"   Password: {ADMIN_PASSWORD}")
        else:
            print(f"❌ Password mismatch — check hash function")

print("🔌 Done!")