import csv 
import psycopg2 
from app.database import SessionLocal 
from app.models.user import User 
from app.models.activation import ActivationRequest 
from app.models.listing import Listing 
from sqlalchemy import text 
 
print("Importing users...") 
conn = psycopg2.connect("postgresql://postgres:melkamu123%%40@localhost:5432/estatehub_local") 
cur = conn.cursor() 
with open('C:/temp/users_export.csv', 'r', encoding='utf-8') as f: 
    reader = csv.reader(f) 
    header = next(reader) 
    for row in reader: 
        placeholders = ','.join(['%s'] * len(row)) 
        cur.execute(f"INSERT INTO users VALUES ({placeholders})", row) 
conn.commit() 
print("Users imported!") 
