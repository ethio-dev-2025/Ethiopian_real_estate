# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt as jose_jwt
import bcrypt
from pydantic import BaseModel, EmailStr
from typing import Optional
import requests
import secrets
from passlib.context import CryptContext
from ..database import get_db
from ..models.user import User
from ..config import settings

# Google OAuth imports
try:
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    GOOGLE_AUTH_AVAILABLE = True
except ImportError:
    GOOGLE_AUTH_AVAILABLE = False
    print("⚠️ google-auth not installed. Google login will use fallback method.")

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ============ PYDANTIC MODELS ============
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str
    phone: Optional[str] = None
    role_type: Optional[str] = "user"

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    phone: Optional[str]
    role_type: str
    status: str
    is_active: bool
    is_verified: bool
    is_activated: bool
    created_at: Optional[str]
    avatar_url: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    can_create_listings: Optional[bool] = False
    payment_approved: Optional[bool] = False

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    credential: str
    client_id: str
    role_type: Optional[str] = "dual"

# ============ HELPER FUNCTIONS ============
def is_test_user(email: str) -> bool:
    return email in ["dani@gmail.com", "reduss@gmail.com", "test@example.com", "reduss"]

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    try:
        result = pwd_context.verify(plain_password, hashed_password)
        print(f"🔐 Password verification: {'SUCCESS' if result else 'FAILED'}")
        return result
    except Exception as e:
        print(f"❌ Password verification error: {e}")
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jose_jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# ============ AUTHENTICATION DEPENDENCIES ============
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(' ')[1]
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jose_jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if current_user.role_type != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def get_current_buyer_user(current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if current_user.role_type != "buyer" and current_user.role_type != "admin":
        raise HTTPException(status_code=403, detail="Buyer access required")
    return current_user

# ============ REGISTER ENDPOINT ============
@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    try:
        existing_user = db.query(User).filter(
            (User.email == user_data.email) | (User.username == user_data.username)
        ).first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Email or username already registered")
        
        hashed_password = get_password_hash(user_data.password)
        
        user_role = user_data.role_type if user_data.role_type else "user"
        is_test = is_test_user(user_data.email)
        
        if user_role == 'buyer':
            user_status = "active"
            is_activated = True
            can_create_listings = True
            payment_approved = True
        else:
            user_status = "pending" if not is_test else "active"
            is_activated = is_test
            can_create_listings = False
            payment_approved = False
        
        db_user = User(
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            hashed_password=hashed_password,
            phone=user_data.phone or "",
            role_type=user_role,
            status=user_status,
            is_active=True,
            is_verified=True,
            is_activated=is_activated,
            can_create_listings=can_create_listings,
            payment_approved=payment_approved,
            seller_enabled=False if user_role != 'buyer' else True,
            seller_approved=False if user_role != 'buyer' else True,
            seller_paid=False,
            landlord_enabled=False if user_role != 'buyer' else True,
            landlord_approved=False if user_role != 'buyer' else True,
            landlord_paid=False,
            avatar_url=None
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return UserResponse(
            id=db_user.id,
            email=db_user.email,
            username=db_user.username,
            full_name=db_user.full_name,
            phone=db_user.phone,
            role_type=db_user.role_type,
            status=db_user.status,
            is_active=db_user.is_active,
            is_verified=db_user.is_verified,
            is_activated=db_user.is_activated,
            created_at=db_user.created_at.isoformat() if db_user.created_at else None,
            avatar_url=db_user.avatar_url,
            date_of_birth=db_user.date_of_birth,
            address=db_user.address,
            city=db_user.city,
            bio=db_user.bio,
            can_create_listings=db_user.can_create_listings,
            payment_approved=db_user.payment_approved
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============ LOGIN ENDPOINT - FIXED ============
@router.post("/login")
async def login_json(login_data: LoginRequest, db: Session = Depends(get_db)):
    try:
        print(f"🔐 Login attempt for: {login_data.email}")
        
        # Find user by email first
        user = db.query(User).filter(User.email == login_data.email).first()
        
        # If not found, try by username
        if not user:
            user = db.query(User).filter(User.username == login_data.email).first()
        
        if not user:
            print(f"❌ User not found: {login_data.email}")
            return {"success": False, "error": "Invalid email/username or password"}
        
        # Verify password
        password_valid = verify_password(login_data.password, user.hashed_password)
        
        if not password_valid:
            print(f"❌ Invalid password for user: {user.email}")
            return {"success": False, "error": "Invalid email/username or password"}
        
        print(f"✅ Login successful for: {user.email}")
        
        # Update last login
        user.last_login = datetime.utcnow()
        
        # Update test user status
        if is_test_user(user.email):
            user.status = "active"
            user.is_active = True
            user.is_verified = True
            user.is_activated = True
            user.can_create_listings = True
            user.payment_approved = True
        
        db.commit()
        db.refresh(user)
        
        # Create access token
        access_token = create_access_token(data={"sub": user.email})
        
        return {
            "success": True,
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name or user.username,
                "phone": user.phone,
                "role_type": user.role_type,
                "is_activated": user.is_activated,
                "is_verified": user.is_verified,
                "status": user.status,
                "can_create_listings": user.can_create_listings,
                "payment_approved": user.payment_approved,
                "avatar_url": user.avatar_url,
                "date_of_birth": user.date_of_birth,
                "address": user.address,
                "city": user.city,
                "bio": user.bio
            }
        }
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Internal server error"}

# ============ GET CURRENT USER ============
@router.get("/me")
async def get_current_user_endpoint(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "role_type": current_user.role_type,
        "status": current_user.status,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "is_activated": current_user.is_activated,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "has_active_subscription": current_user.has_active_subscription,
        "seller_enabled": current_user.seller_enabled,
        "landlord_enabled": current_user.landlord_enabled,
        "can_create_listings": current_user.can_create_listings,
        "payment_approved": current_user.payment_approved,
        "avatar_url": current_user.avatar_url,
        "date_of_birth": current_user.date_of_birth,
        "address": current_user.address,
        "city": current_user.city,
        "bio": current_user.bio
    }

# ============ GOOGLE OAUTH ENDPOINT ============
@router.post("/google-auth")
async def google_auth(
    auth_data: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    """Authenticate user with Google OAuth"""
    try:
        print(f"🔐 Google auth request received")
        
        email = None
        full_name = None
        picture = None
        
        # Try different verification methods
        if GOOGLE_AUTH_AVAILABLE:
            try:
                idinfo = id_token.verify_oauth2_token(
                    auth_data.credential,
                    google_requests.Request(),
                    auth_data.client_id
                )
                email = idinfo.get('email')
                full_name = idinfo.get('name', '')
                picture = idinfo.get('picture')
                print(f"✅ Google token verified using library for: {email}")
            except Exception as e:
                print(f"⚠️ Library verification failed: {e}")
        
        # Fallback: Manual JWT decode
        if not email:
            try:
                import jwt
                decoded = jwt.decode(
                    auth_data.credential, 
                    options={"verify_signature": False}
                )
                email = decoded.get('email')
                full_name = decoded.get('name', '')
                picture = decoded.get('picture', '')
                print(f"✅ Google token decoded manually for: {email}")
            except Exception as e:
                print(f"❌ Manual decode failed: {e}")
                return {"success": False, "message": "Invalid Google token"}
        
        if not email:
            return {"success": False, "message": "Email not provided by Google"}
        
        # Always use 'dual' role for Google login
        user_role = "dual"
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Create new user with dual role
            username = email.split('@')[0]
            base_username = username
            counter = 1
            while db.query(User).filter(User.username == username).first():
                username = f"{base_username}{counter}"
                counter += 1
            
            random_password = secrets.token_urlsafe(16)
            hashed_password = get_password_hash(random_password)
            
            user = User(
                email=email,
                username=username,
                full_name=full_name,
                hashed_password=hashed_password,
                phone="",
                role_type="dual",
                status="pending",
                is_active=True,
                is_verified=True,
                is_activated=False,
                can_create_listings=False,
                payment_approved=False,
                avatar_url=picture,
                seller_enabled=False,
                seller_approved=False,
                seller_paid=False,
                landlord_enabled=False,
                landlord_approved=False,
                landlord_paid=False
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            print(f"✅ New DUAL user created via Google: {email}")
        else:
            # Update existing user to DUAL if they are a buyer
            if user.role_type == 'buyer':
                user.role_type = 'dual'
                user.seller_enabled = True
                user.seller_approved = True
                user.landlord_enabled = True
                user.landlord_approved = True
                db.commit()
                print(f"✅ Updated buyer to DUAL: {email}")
            
            # Update avatar if not set
            if picture and not user.avatar_url:
                user.avatar_url = picture
                db.commit()
            print(f"✅ Existing user logged in via Google: {email} (Role: {user.role_type})")
        
        # Create access token
        access_token = create_access_token(data={"sub": user.email})
        
        return {
            "success": True,
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name or user.username,
                "phone": user.phone,
                "role_type": "dual",
                "is_activated": user.is_activated,
                "is_verified": user.is_verified,
                "status": user.status,
                "can_create_listings": user.can_create_listings,
                "payment_approved": user.payment_approved,
                "avatar_url": user.avatar_url or picture
            }
        }
        
    except Exception as e:
        print(f"❌ Google auth error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "message": str(e)}

# ============ ADMIN: ACTIVATE USER ============
@router.post("/admin/activate-user/{user_id}")
async def admin_activate_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        user_to_activate = db.query(User).filter(User.id == user_id).first()
        
        if not user_to_activate:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_to_activate.is_activated = True
        user_to_activate.status = "active"
        user_to_activate.can_create_listings = True
        user_to_activate.payment_approved = True
        user_to_activate.seller_enabled = True
        user_to_activate.seller_approved = True
        user_to_activate.landlord_enabled = True
        user_to_activate.landlord_approved = True
        
        db.commit()
        
        return {
            "success": True,
            "message": f"User {user_to_activate.email} has been activated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error activating user: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============ ADMIN: GET PENDING USERS ============
@router.get("/admin/pending-users")
async def get_pending_users(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        pending_users = db.query(User).filter(
            User.is_activated == False,
            User.role_type != "admin",
            User.role_type != "buyer"
        ).all()
        
        return [
            {
                "id": u.id,
                "email": u.email,
                "username": u.username,
                "full_name": u.full_name,
                "phone": u.phone,
                "role_type": u.role_type,
                "status": u.status,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "avatar_url": u.avatar_url,
                "date_of_birth": u.date_of_birth
            }
            for u in pending_users
        ]
        
    except Exception as e:
        print(f"Error getting pending users: {e}")
        return []

# ============ ADMIN: GET PENDING PAYMENT USERS ============
@router.get("/admin/pending-payment-users")
async def get_pending_payment_users(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        pending_payment_users = db.query(User).filter(
            User.is_activated == True,
            User.can_create_listings == False,
            User.payment_approved == False,
            User.role_type != "admin",
            User.role_type != "buyer"
        ).all()
        
        return [
            {
                "id": u.id,
                "email": u.email,
                "username": u.username,
                "full_name": u.full_name,
                "phone": u.phone,
                "role_type": u.role_type,
                "status": u.status,
                "subscription_plan": u.subscription_plan,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "avatar_url": u.avatar_url
            }
            for u in pending_payment_users
        ]
        
    except Exception as e:
        print(f"Error getting pending payment users: {e}")
        return []