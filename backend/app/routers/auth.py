from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
from pydantic import BaseModel, EmailStr
from typing import Optional
from ..database import get_db
from ..models import User
from ..config import settings

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

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

class LoginRequest(BaseModel):
    email: str
    password: str

# ============ HELPER FUNCTIONS ============
def is_test_user(email: str) -> bool:
    return email in ["dani@gmail.com", "reduss@gmail.com", "test@example.com", "reduss"]

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
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
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
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

# ============ REGISTER ENDPOINT - FIXED ============
@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    try:
        existing_user = db.query(User).filter(
            (User.email == user_data.email) | (User.username == user_data.username)
        ).first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Email or username already registered")
        
        hashed_password = get_password_hash(user_data.password)
        
        # USE THE ROLE_TYPE FROM REQUEST, default to 'user'
        user_role = user_data.role_type if user_data.role_type else "user"
        
        # For test users, auto-activate
        is_test = is_test_user(user_data.email)
        
        db_user = User(
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            hashed_password=hashed_password,
            phone=user_data.phone or "",
            role_type=user_role,
            status="pending" if not is_test else "active",  # Set to pending for new users
            is_active=True,
            is_verified=True,
            is_activated=is_test,  # Only test users are activated immediately
            seller_enabled=False,  # Disabled until admin approves
            seller_approved=False,  # Not approved yet
            seller_paid=False,
            landlord_enabled=False,
            landlord_approved=False,
            landlord_paid=False
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
            created_at=db_user.created_at.isoformat() if db_user.created_at else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============ LOGIN ENDPOINT ============
@router.post("/login")
async def login_json(login_data: LoginRequest, db: Session = Depends(get_db)):
    try:
        # Find by email first
        user = db.query(User).filter(User.email == login_data.email).first()
        
        if not user:
            user = db.query(User).filter(User.username == login_data.email).first()
        
        if not user:
            return {"success": False, "error": "Invalid email/username or password"}
        
        # Verify password
        if not verify_password(login_data.password, user.hashed_password):
            return {"success": False, "error": "Invalid email/username or password"}
        
        # Update user status for test users
        if is_test_user(user.email):
            user.status = "active"
            user.is_active = True
            user.is_verified = True
            user.is_activated = True
            db.commit()
        elif user.status == "pending":
            user.status = "active"
            db.commit()
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()
        
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
                "status": user.status
            }
        }
        
    except Exception as e:
        print(f"Login error: {e}")
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
        "landlord_enabled": current_user.landlord_enabled
    }


# ============ ADMIN: ACTIVATE USER ============
@router.post("/admin/activate-user/{user_id}")
async def admin_activate_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Admin endpoint to activate a user account"""
    try:
        user_to_activate = db.query(User).filter(User.id == user_id).first()
        
        if not user_to_activate:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_to_activate.is_activated = True
        user_to_activate.status = "active"
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
    """Get all users with pending activation"""
    try:
        pending_users = db.query(User).filter(
            User.is_activated == False,
            User.role_type != "admin"
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
                "created_at": u.created_at.isoformat() if u.created_at else None
            }
            for u in pending_users
        ]
        
    except Exception as e:
        print(f"Error getting pending users: {e}")
        return []