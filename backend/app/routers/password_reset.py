from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import bcrypt
from pydantic import BaseModel, EmailStr
from ..database import get_db
from ..models import User, PasswordReset

router = APIRouter()

# Pydantic Models
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """Send password reset email"""
    try:
        print(f"\n=== PASSWORD RESET REQUEST ===")
        print(f"Email: {request.email}")
        
        # Find user by email
        user = db.query(User).filter(User.email == request.email).first()
        
        # For security, always return success even if user doesn't exist
        if not user:
            print(f"User not found: {request.email}")
            return {
                "message": "If your email is registered, you will receive a reset link",
                "reset_link": None
            }
        
        # Generate unique token
        token = secrets.token_urlsafe(32)
        
        # Delete any existing unused tokens for this user
        db.query(PasswordReset).filter(
            PasswordReset.user_id == user.id,
            PasswordReset.used == False
        ).delete()
        
        # Create new reset token (expires in 1 hour)
        expires_at = datetime.utcnow() + timedelta(hours=1)
        
        reset_entry = PasswordReset(
            user_id=user.id,
            token=token,
            used=False,
            expires_at=expires_at
        )
        
        db.add(reset_entry)
        db.commit()
        
        # Create reset link (for frontend)
        reset_link = f"http://localhost:5173/reset-password?token={token}"
        
        print(f"✅ Reset token created for {user.email}")
        print(f"🔗 Reset link: {reset_link}")
        print(f"⏰ Expires at: {expires_at}")
        print(f"===========================\n")
        
        # In a real application, send email here
        # For now, return the reset link for testing
        return {
            "message": "Password reset link sent to your email",
            "reset_link": reset_link,
            "email": request.email
        }
        
    except Exception as e:
        print(f"Error in forgot_password: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """Reset password using token"""
    try:
        print(f"\n=== PASSWORD RESET VERIFICATION ===")
        print(f"Token: {request.token[:20]}...")
        
        # Find valid reset token
        reset_entry = db.query(PasswordReset).filter(
            PasswordReset.token == request.token,
            PasswordReset.used == False,
            PasswordReset.expires_at > datetime.utcnow()
        ).first()
        
        if not reset_entry:
            print("❌ Invalid or expired token")
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
        # Get user
        user = db.query(User).filter(User.id == reset_entry.user_id).first()
        if not user:
            print(f"❌ User not found for token")
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update password
        user.hashed_password = get_password_hash(request.new_password)
        
        # Mark token as used
        reset_entry.used = True
        reset_entry.used_at = datetime.utcnow()
        
        db.commit()
        
        print(f"✅ Password reset successful for: {user.email}")
        print(f"===========================\n")
        
        return {"message": "Password reset successful"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in reset_password: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/verify-token/{token}")
async def verify_reset_token(
    token: str,
    db: Session = Depends(get_db)
):
    """Verify if a reset token is valid"""
    try:
        reset_entry = db.query(PasswordReset).filter(
            PasswordReset.token == token,
            PasswordReset.used == False,
            PasswordReset.expires_at > datetime.utcnow()
        ).first()
        
        if reset_entry:
            return {"valid": True, "message": "Token is valid"}
        else:
            return {"valid": False, "message": "Token is invalid or expired"}
            
    except Exception as e:
        print(f"Error verifying token: {e}")
        return {"valid": False, "message": "Error verifying token"}