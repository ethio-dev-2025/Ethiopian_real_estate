# backend/fix_sequences.py
from sqlalchemy import create_engine, text

NEON_DB_URL = "postgresql://neondb_owner:npg_bpX65nWGTUZN@ep-little-pine-bedmsd75-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

engine = create_engine(NEON_DB_URL)

# List of tables that have auto-incrementing IDs
tables = [
    "users", "listings", "activation_requests", "conversations", 
    "messages", "payment_transactions", "transactions", "notifications"
]

with engine.connect() as conn:
    print("🔧 Fixing sequences...")
    for table in tables:
        try:
            # Check if the table exists and has an 'id' column
            query = text(f"""
                SELECT setval(
                    pg_get_serial_sequence('{table}', 'id'),
                    COALESCE((SELECT MAX(id) FROM {table}), 1),
                    (SELECT MAX(id) IS NOT NULL FROM {table})
                );
            """)
            conn.execute(query)
            print(f"✅ Fixed sequence for {table}")
        except Exception as e:
            print(f"⚠️ Could not fix {table}: {e}")
    conn.commit()
    print("🎉 All sequences updated!")