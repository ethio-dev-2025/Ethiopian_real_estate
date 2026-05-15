from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
import bcrypt
from fastapi import HTTPException
from ..models.user import User, UserRoleAssignment, UserRole, RoleStatus
from ..schemas.user import UserCreate
from ..config import settings
import logging

logger = logging.getLogger(__name__)

class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        if not password:
            raise ValueError("Password cannot be empty")
        
        password_bytes = password.encode('utf-8')
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        if not plain_password or not hashed_password:
            return False
        
        password_bytes = plain_password.encode('utf-8')
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        
        try:
            return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))
        except Exception:
            return False
    
    @staticmethod
    def create_access_token(data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    @staticmethod
    def create_refresh_token(data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    @staticmethod
    def register_user(db: Session, user_data: UserCreate):
        try:
            logger.info(f"Starting registration for: {user_data.email}")
            
            # Hash password
            hashed_password = AuthService.hash_password(user_data.password)
            logger.info("Password hashed successfully")
            
            # Create user
            db_user = User(
                email=user_data.email.lower().strip(),
                username=user_data.username.lower().strip(),
                full_name=user_data.full_name.strip(),
                phone=user_data.phone or "",
                company=user_data.company or "",
                password_hash=hashed_password,
                is_active=True,
                is_verified=False
            )
            
            db.add(db_user)
            db.flush()
            logger.info(f"User created with ID: {db_user.id}")
            
            # Assign buyer role by default
            role_assignment = UserRoleAssignment(
                user_id=db_user.id,
                role=UserRole.BUYER,
                status=RoleStatus.ACTIVE,
                documents_submitted=False,
                documents_approved=False,
                subscription_active=False
            )
            
            db.add(role_assignment)
            db.commit()
            db.refresh(db_user)
            
            logger.info(f"User registered successfully: {user_data.email}")
            return db_user
            
        except Exception as e:
            logger.error(f"Registration service error: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str):
        try:
            logger.info(f"Authenticating user: {email}")
            user = db.query(User).filter(User.email == email.lower().strip()).first()
            
            if not user:
                logger.warning(f"User not found: {email}")
                return None
            
            if not AuthService.verify_password(password, user.password_hash):
                logger.warning(f"Invalid password for: {email}")
                return None
                
            logger.info(f"User authenticated: {email}")
            return user
            
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return None
