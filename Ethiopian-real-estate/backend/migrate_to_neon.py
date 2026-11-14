# backend/migrate_to_neon.py
import os
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()
LOCAL_DB_URL = os.getenv("DATABASE_URL")
NEON_DB_URL = "postgresql://neondb_owner:npg_bpX65nWGTUZN@ep-little-pine-bedmsd75-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

print("🔌 Connecting to local database...")
local_engine = create_engine(LOCAL_DB_URL)
LocalSession = sessionmaker(bind=local_engine)
local_db = LocalSession()

print("🔌 Connecting to Neon database...")
neon_engine = create_engine(NEON_DB_URL)
NeonSession = sessionmaker(bind=neon_engine)
neon_db = NeonSession()

from app.models import (
    User, Listing, Message, Conversation, MessageStatus, Notification,
    SavedProperty, PasswordReset, ActivationRequest, ActivationStatus,
    Company, Subscription, VerificationDocument, AdminActivity,
    RoleDocument, RoleSubscription, DocumentType, DocumentStatus,
    PaymentTransaction, Transaction
)
from app.database import Base

# 1. Create tables in Neon (skip if they exist)
print("🏗️ Creating tables in Neon...")
Base.metadata.create_all(bind=neon_engine)
print("✅ Tables ready!")

# 2. Migration order (foreign-key safe)
models_to_migrate = [
    User,
    Company,
    Listing,
    Transaction,
    PaymentTransaction,
    ActivationRequest,
    RoleDocument,
    RoleSubscription,
    VerificationDocument,
    Conversation,
    Message,
    Notification,
    SavedProperty,
    PasswordReset,
    Subscription,
    AdminActivity
]

# 3. Copy data table-by-table
for model in models_to_migrate:
    table_name = model.__tablename__
    print(f"\n📦 Migrating {table_name}...")

    rows = local_db.query(model).all()
    if not rows:
        print(f"   ⏭️ No data in {table_name}")
        continue

    print(f"   Found {len(rows)} rows. Copying...")

    try:
        columns = [c.name for c in model.__table__.columns]
        cols_str = ", ".join(columns)
        placeholders = ", ".join([f":{c}" for c in columns])

        insert_sql = text(f"""
            INSERT INTO {table_name} ({cols_str})
            VALUES ({placeholders})
            ON CONFLICT (id) DO NOTHING
        """)

        success = 0
        skipped = 0

        for row in rows:
            row_dict = {c: getattr(row, c) for c in columns}

            # Check FK integrity for key relations
            if table_name == "listings":
                user_exists = neon_db.execute(
                    text("SELECT 1 FROM users WHERE id = :uid"),
                    {"uid": row_dict["user_id"]}
                ).first()
                if not user_exists:
                    skipped += 1
                    continue

            try:
                neon_db.execute(insert_sql, row_dict)
                neon_db.commit()
                success += 1
            except Exception as row_err:
                neon_db.rollback()
                print(f"   ⚠️ Skipped row {row_dict.get('id')}: {str(row_err)[:80]}")
                skipped += 1

        print(f"   ✅ {table_name}: {success} migrated, {skipped} skipped")

    except Exception as e:
        neon_db.rollback()
        print(f"   ❌ Error migrating {table_name}: {e}")

print("\n🎉 Migration complete!")
local_db.close()
neon_db.close()