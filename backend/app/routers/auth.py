# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt as jose_jwt
import bcrypt
import re
from pydantic import BaseModel, EmailStr, field_validator
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

# ============ EMAIL VALIDATION FUNCTIONS ============
def is_gmail_email(email: str) -> bool:
    """Validate that email is a Gmail address"""
    if not email:
        return False
    
    email_lower = email.lower().strip()
    allowed_domains = ['gmail.com', 'googlemail.com']
    
    for domain in allowed_domains:
        if email_lower.endswith(f'@{domain}'):
            return True
    return False

def validate_email_format(email: str) -> bool:
    """Validate email format using regex"""
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(email_pattern, email) is not None

def normalize_gmail(email: str) -> str:
    """Normalize Gmail address by removing dots and +aliases"""
    if not email:
        return email
    
    email_lower = email.lower().strip()
    
    is_gmail = False
    domain = None
    
    for d in ['gmail.com', 'googlemail.com']:
        if email_lower.endswith(f'@{d}'):
            is_gmail = True
            domain = d
            break
    
    if is_gmail:
        local_part = email_lower.split('@')[0]
        local_part = local_part.replace('.', '')
        if '+' in local_part:
            local_part = local_part.split('+')[0]
        return f"{local_part}@{domain}"
    
    return email_lower

def normalize_buyer_email(username: str) -> str:
    """Generate a unique email for buyer accounts"""
    return f"{username.lower().strip()}@buyer.estatehub.com"

# ============ PHONE NUMBER VALIDATION FUNCTIONS ============
def validate_ethiopian_phone(phone: str) -> bool:
    """Validate Ethiopian phone numbers"""
    if not phone:
        return False
    
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)
    
    patterns = [
        r'^09\d{8}$',
        r'^07\d{8}$',
        r'^2519\d{8}$',
        r'^\+2519\d{8}$',
    ]
    
    for pattern in patterns:
        if re.match(pattern, cleaned):
            return True
    return False

def normalize_ethiopian_phone(phone: str) -> str:
    """Normalize phone number to 09xxxxxxxx format"""
    if not phone:
        return ""
    
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)
    
    if cleaned.startswith('+2519'):
        cleaned = '0' + cleaned[4:]
    elif cleaned.startswith('2519'):
        cleaned = '0' + cleaned[3:]
    
    return cleaned

# ============ PYDANTIC MODELS WITH ROLE-BASED VALIDATION ============
class UserCreate(BaseModel):
    email: Optional[str] = None  # Made optional for buyers
    username: str
    password: str
    full_name: str
    phone: Optional[str] = None
    role_type: Optional[str] = "user"
    
    @field_validator('email')
    def validate_email(cls, v, info):
        """Validate email based on role type"""
        role_type = info.data.get('role_type', 'user')
        
        # For buyers, email is optional - no validation needed
        if role_type == 'buyer':
            return v if v else None
        
        # For sellers, landlords, dual - Gmail is required
        if not v:
            raise ValueError('Email is required for sellers/landlords')
        
        if not validate_email_format(v):
            raise ValueError('Invalid email format')
        
        if not is_gmail_email(v):
            raise ValueError('Email must be a Gmail address (username@gmail.com)')
        
        return v.lower().strip()
    
    @field_validator('username')
    def validate_username(cls, v):
        if not v or len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v.lower().strip()
    
    @field_validator('phone')
    def validate_phone(cls, v):
        if v and v.strip():
            if not validate_ethiopian_phone(v):
                raise ValueError('Please enter a valid Ethiopian phone number (e.g., 0912345678)')
        return v

class UserResponse(BaseModel):
    id: int
    email: Optional[str]
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
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
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

# ============ REGISTER ENDPOINT - WITH ROLE-BASED EMAIL VALIDATION ============
@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    try:
        user_role = user_data.role_type if user_data.role_type else "user"
        
        # Handle email based on role
        if user_role == 'buyer':
            # For buyers: generate email from username if not provided
            if user_data.email:
                normalized_email = user_data.email.lower().strip()
            else:
                normalized_email = normalize_buyer_email(user_data.username)
        else:
            # For sellers/landlords/dual: normalize Gmail
            if not user_data.email:
                raise HTTPException(status_code=400, detail="Email is required for sellers/landlords")
            normalized_email = normalize_gmail(user_data.email)
        
        # Normalize phone if provided
        phone_normalized = None
        if user_data.phone and user_data.phone.strip():
            phone_normalized = normalize_ethiopian_phone(user_data.phone)
        
        # CHECK IF EMAIL ALREADY EXISTS
        existing_email = db.query(User).filter(User.email == normalized_email).first()
        if existing_email:
            raise HTTPException(
                status_code=400, 
                detail="Email already registered. Please use a different email or login."
            )
        
        # CHECK IF USERNAME ALREADY EXISTS
        username_normalized = user_data.username.lower().strip()
        existing_username = db.query(User).filter(User.username == username_normalized).first()
        if existing_username:
            raise HTTPException(
                status_code=400, 
                detail="Username already taken. Please choose another username."
            )
        
        # CHECK IF PHONE NUMBER ALREADY EXISTS
        if phone_normalized:
            existing_phone = db.query(User).filter(User.phone == phone_normalized).first()
            if existing_phone:
                raise HTTPException(
                    status_code=400, 
                    detail="Phone number already registered. Please use a different phone number or login."
                )
        
        # Hash password
        hashed_password = get_password_hash(user_data.password)
        
        # Buyers get activated immediately, sellers/landlords need approval
        if user_role == 'buyer':
            user_status = "active"
            is_activated = True
            can_create_listings = True
            payment_approved = True
            is_verified = True
        else:
            user_status = "pending"
            is_activated = False
            can_create_listings = False
            payment_approved = False
            is_verified = False
        
        db_user = User(
            email=normalized_email,
            username=username_normalized,
            full_name=user_data.full_name,
            hashed_password=hashed_password,
            phone=phone_normalized or "",
            role_type=user_role,
            status=user_status,
            is_active=True,
            is_verified=is_verified,
            is_activated=is_activated,
            can_create_listings=can_create_listings,
            payment_approved=payment_approved,
            seller_enabled=False,
            seller_approved=False,
            seller_paid=False,
            landlord_enabled=False,
            landlord_approved=False,
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

# ============ CHECK EMAIL AVAILABILITY ENDPOINT (Role-based) ============
@router.get("/check-email")
async def check_email_availability(
    email: str,
    role_type: str = "dual",
    db: Session = Depends(get_db)
):
    """Check if email is available for registration (Gmail only for sellers)"""
    if not email:
        return {"available": False, "valid_format": False, "valid_domain": False, "message": "Email is required"}
    
    # For buyers, any email format is acceptable or no email needed
    if role_type == 'buyer':
        return {"available": True, "valid_format": True, "valid_domain": True, "message": "Email is available"}
    
    # For sellers/landlords/dual - must be Gmail
    if not validate_email_format(email):
        return {"available": False, "valid_format": False, "valid_domain": False, "message": "Invalid email format"}
    
    if not is_gmail_email(email):
        return {
            "available": False, 
            "valid_format": True, 
            "valid_domain": False, 
            "message": "Only Gmail addresses are allowed (username@gmail.com)"
        }
    
    normalized_email = normalize_gmail(email)
    existing = db.query(User).filter(User.email == normalized_email).first()
    
    return {
        "available": existing is None,
        "valid_format": True,
        "valid_domain": True,
        "message": "Email is available" if not existing else "Email already registered"
    }

# ============ CHECK PHONE AVAILABILITY ENDPOINT ============
@router.get("/check-phone")
async def check_phone_availability(
    phone: str,
    db: Session = Depends(get_db)
):
    """Check if phone number is available for registration"""
    if not phone:
        return {"available": False, "valid_format": False, "message": "Phone number is required"}
    
    if not validate_ethiopian_phone(phone):
        return {
            "available": False, 
            "valid_format": False, 
            "message": "Invalid Ethiopian phone number. Please use format: 0912345678 or 251912345678"
        }
    
    normalized_phone = normalize_ethiopian_phone(phone)
    existing = db.query(User).filter(User.phone == normalized_phone).first()
    
    return {
        "available": existing is None,
        "valid_format": True,
        "message": "Phone number is available" if not existing else "Phone number already registered"
    }

# ============ CHECK USERNAME AVAILABILITY ENDPOINT ============
@router.get("/check-username")
async def check_username_availability(
    username: str,
    db: Session = Depends(get_db)
):
    """Check if username is available for registration"""
    if not username or len(username) < 3:
        return {
            "available": False, 
            "valid_format": False, 
            "message": "Username must be at least 3 characters"
        }
    
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return {
            "available": False, 
            "valid_format": False, 
            "message": "Username can only contain letters, numbers, and underscores"
        }
    
    existing = db.query(User).filter(User.username == username.lower().strip()).first()
    return {
        "available": existing is None,
        "valid_format": True,
        "message": "Username is available" if not existing else "Username already taken"
    }

# ============ LOGIN ENDPOINT - WITH SUSPENSION CHECK ============
@router.post("/login")
async def login_json(login_data: LoginRequest, db: Session = Depends(get_db)):
    try:
        print(f"🔐 Login attempt for: {login_data.email}")
        
        user = db.query(User).filter(User.email == login_data.email.lower().strip()).first()
        
        if not user:
            user = db.query(User).filter(User.username == login_data.email.lower().strip()).first()
        
        if not user:
            print(f"❌ User not found: {login_data.email}")
            return {"success": False, "error": "Invalid username or password"}
        
        if user.status == "suspended":
            print(f"🚫 User {user.email} is SUSPENDED - login blocked")
            return {"success": False, "error": "Your account has been suspended. Please contact support."}
        
        password_valid = verify_password(login_data.password, user.hashed_password)
        
        if not password_valid:
            print(f"❌ Invalid password for user: {user.email}")
            return {"success": False, "error": "Invalid username or password"}
        
        print(f"✅ Login successful for: {user.email}")
        
        user.last_login = datetime.utcnow()
        db.commit()
        db.refresh(user)
        
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
                "bio": user.bio,
                "position": getattr(user, 'position', 'Administrator'),
                "department": getattr(user, 'department', 'Management'),
                "has_active_subscription": user.has_active_subscription,
                "subscription_plan": user.subscription_plan,
                "subscription_start_date": user.subscription_start_date.isoformat() if user.subscription_start_date else None,
                "subscription_end_date": user.subscription_end_date.isoformat() if user.subscription_end_date else None
            }
        }
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Internal server error"}

# ============ GET CURRENT USER (ME) ENDPOINT ============
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
        "subscription_plan": current_user.subscription_plan,
        "subscription_start_date": current_user.subscription_start_date.isoformat() if current_user.subscription_start_date else None,
        "subscription_end_date": current_user.subscription_end_date.isoformat() if current_user.subscription_end_date else None,
        "seller_enabled": current_user.seller_enabled,
        "landlord_enabled": current_user.landlord_enabled,
        "can_create_listings": current_user.can_create_listings,
        "payment_approved": current_user.payment_approved,
        "avatar_url": current_user.avatar_url,
        "date_of_birth": current_user.date_of_birth,
        "address": current_user.address,
        "city": current_user.city,
        "bio": current_user.bio,
        "position": getattr(current_user, 'position', 'Administrator'),
        "department": getattr(current_user, 'department', 'Management')
    }

# ============ FORCE REFRESH USER ENDPOINT ============
@router.get("/force-refresh")
async def force_refresh_user(current_user: User = Depends(get_current_user)):
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
        "subscription_plan": current_user.subscription_plan,
        "subscription_start_date": current_user.subscription_start_date.isoformat() if current_user.subscription_start_date else None,
        "subscription_end_date": current_user.subscription_end_date.isoformat() if current_user.subscription_end_date else None,
        "seller_enabled": current_user.seller_enabled,
        "landlord_enabled": current_user.landlord_enabled,
        "can_create_listings": current_user.can_create_listings,
        "payment_approved": current_user.payment_approved,
        "avatar_url": current_user.avatar_url,
        "date_of_birth": current_user.date_of_birth,
        "address": current_user.address,
        "city": current_user.city,
        "bio": current_user.bio,
        "position": getattr(current_user, 'position', 'Administrator'),
        "department": getattr(current_user, 'department', 'Management')
    }

# ============ GOOGLE OAUTH ENDPOINT ============
@router.post("/google-auth")
async def google_auth(
    auth_data: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    try:
        print(f"🔐 Google auth request received")
        
        email = None
        full_name = None
        picture = None
        
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
        
        user_role = auth_data.role_type if auth_data.role_type else "dual"
        normalized_email = normalize_gmail(email)
        user = db.query(User).filter(User.email == normalized_email).first()
        
        if not user:
            username = email.split('@')[0].replace('.', '')
            base_username = username
            counter = 1
            while db.query(User).filter(User.username == username).first():
                username = f"{base_username}{counter}"
                counter += 1
            
            random_password = secrets.token_urlsafe(16)
            hashed_password = get_password_hash(random_password)
            
            user = User(
                email=normalized_email,
                username=username,
                full_name=full_name,
                hashed_password=hashed_password,
                phone="",
                role_type=user_role,
                status="pending" if user_role != "buyer" else "active",
                is_active=True,
                is_verified=False if user_role != "buyer" else True,
                is_activated=False if user_role != "buyer" else True,
                can_create_listings=False if user_role != "buyer" else True,
                payment_approved=False if user_role != "buyer" else True,
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
            
            print(f"✅ New user created via Google: {email} (Role: {user_role})")
        else:
            if picture and not user.avatar_url:
                user.avatar_url = picture
                db.commit()
            print(f"✅ Existing user logged in via Google: {email} (Role: {user.role_type})")
        
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
                "avatar_url": user.avatar_url or picture,
                "has_active_subscription": user.has_active_subscription,
                "subscription_plan": user.subscription_plan,
                "subscription_end_date": user.subscription_end_date.isoformat() if user.subscription_end_date else None
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

# ============ ADMIN: DEBUG USER ============
@router.get("/debug-user/{user_id}")
async def debug_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}
    
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "is_activated": user.is_activated,
        "can_create_listings": user.can_create_listings,
        "has_active_subscription": user.has_active_subscription,
        "subscription_end_date": user.subscription_end_date.isoformat() if user.subscription_end_date else None,
        "payment_approved": user.payment_approved,
        "status": user.status
    }

print("✅ Auth router loaded successfully with role-based validation!")