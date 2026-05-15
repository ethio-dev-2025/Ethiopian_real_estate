from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
from pydantic import BaseModel, Field
from typing import Optional
from ..database import get_db
from ..models import User
from ..config import settings

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/buyer/auth/login", auto_error=False)

class BuyerRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    phone_number: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None

class BuyerLogin(BaseModel):
    username: str
    password: str

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

async def get_current_buyer(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username, User.role_type == "buyer").first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register")
async def register_buyer(buyer_data: BuyerRegister, db: Session = Depends(get_db)):
    try:
        existing_user = db.query(User).filter(User.username == buyer_data.username).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        
        existing_phone = db.query(User).filter(User.phone == buyer_data.phone_number).first()
        if existing_phone:
            raise HTTPException(status_code=400, detail="Phone number already registered")
        
        hashed_password = get_password_hash(buyer_data.password)
        
        new_buyer = User(
            username=buyer_data.username,
            full_name=buyer_data.full_name or buyer_data.username,
            hashed_password=hashed_password,
            phone=buyer_data.phone_number,
            email=f"{buyer_data.username}@buyer.temp",
            role_type="buyer",
            status="active",
            is_active=True,
            is_verified=True,
            is_activated=True
        )
        
        db.add(new_buyer)
        db.commit()
        db.refresh(new_buyer)
        
        access_token = create_access_token(data={"sub": new_buyer.username})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": new_buyer.id,
                "username": new_buyer.username,
                "full_name": new_buyer.full_name,
                "phone": new_buyer.phone,
                "role_type": new_buyer.role_type
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
async def login_buyer(login_data: BuyerLogin, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(
            (User.username == login_data.username) | (User.phone == login_data.username)
        ).first()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        if user.role_type != "buyer":
            raise HTTPException(status_code=403, detail="This account is not a buyer account")
        
        if not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        access_token = create_access_token(data={"sub": user.username})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "phone": user.phone,
                "role_type": user.role_type
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me")
async def get_buyer_profile(current_user: User = Depends(get_current_buyer)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "role_type": current_user.role_type
    }