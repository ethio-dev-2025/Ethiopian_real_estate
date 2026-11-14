# backend/check_migration.py
from sqlalchemy import create_engine, text

NEON_URL = "postgresql://neondb_owner:npg_bpX65nWGTUZN@ep-little-pine-bedmsd75-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

print("🔌 Connecting to Neon...")
engine = create_engine(NEON_URL)

with engine.connect() as conn:
    print("\n📊 DATA COUNTS IN NEON:")
    print("-" * 30)
    
    tables = ['users', 'listings', 'payment_transactions', 'activation_requests', 'conversations', 'messages']
    for table in tables:
        try:
            count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            print(f"✅ {table}: {count} rows")
        except Exception as e:
            print(f"❌ {table}: {e}")

    print("\n👑 ADMIN USER CHECK:")
    print("-" * 30)
    admin = conn.execute(text("SELECT email, role_type, status FROM users WHERE role_type = 'admin' LIMIT 1")).first()
    if admin:
        print(f"✅ Admin found: {admin[0]} | Role: {admin[1]} | Status: {admin[2]}")
    else:
        print("⚠️ No admin user found in Neon!")

    print("\n🔍 MESSAGE ENUM VALUES IN NEON:")
    print("-" * 30)
    try:
        enums = conn.execute(text("SELECT enum_range(NULL::message_status)")).fetchall()
        print(f"Enum values: {enums}")
    except Exception as e:
        print(f"⚠️ Could not read message enum: {e}")

print("\n🎉 Check complete!")