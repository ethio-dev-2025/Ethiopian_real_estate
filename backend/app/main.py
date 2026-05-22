# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .routers import (
    auth, admin, listings, users, messages, notifications, 
    payments, settings as settings_router, password_reset, activation, buyer, 
    buyer_auth, admin_messages, websocket
)
from .database import engine, Base, init_db
from .config import settings

# Create uploads directories
os.makedirs("uploads/listings", exist_ok=True)
os.makedirs("uploads/documents", exist_ok=True)
os.makedirs("uploads/activation_documents", exist_ok=True)
os.makedirs("uploads/messages", exist_ok=True)
os.makedirs("uploads/profiles", exist_ok=True)

# Initialize database
init_db()

app = FastAPI(title=settings.APP_NAME, docs_url="/docs")

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ============ CORS CONFIGURATION - FIXED ============
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# ============ REGISTER ROUTERS ============
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(listings.router, prefix="/api/listings", tags=["listings"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(messages.router, prefix="/api/messages", tags=["messages"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(payments.router, prefix="/api/payment", tags=["payment"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["settings"])
app.include_router(password_reset.router, tags=["password_reset"])  # No extra prefix
app.include_router(activation.router, prefix="/api/activation", tags=["activation"])
app.include_router(buyer.router, prefix="/api/buyer", tags=["buyer"])
app.include_router(buyer_auth.router, prefix="/api/buyer/auth", tags=["buyer-auth"])
app.include_router(admin_messages.router, prefix="/api/admin/messages", tags=["admin-messages"])
app.include_router(websocket.router, prefix="/api", tags=["websocket"])

# ============ HEALTH ENDPOINTS ============
@app.get("/")
def root():
    return {"message": "RealEstate Pro API", "version": "1.0.0", "status": "running"}

@app.get("/health")
def health():
    return {"status": "ok", "message": "Server is running", "timestamp": str(__import__("datetime").datetime.now())}

# ============ OPTIONS HANDLER FOR CORS PREFLIGHT ============
@app.options("/{path:path}")
async def options_handler():
    return {}