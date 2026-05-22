# backend/app/routers/password_reset.py
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import bcrypt
from ..database import get_db
from ..models.user import User
from ..services.email_service import email_service
from ..services.email_templates import get_password_reset_email_html

router = APIRouter(prefix="/api/password-reset", tags=["password_reset"])

# In-memory storage for reset codes
reset_codes = {}

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    code: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Send password reset code to user's email"""
    try:
        print(f"📧 POST /api/password-reset/forgot-password - Email: {request.email}")
        
        user = db.query(User).filter(User.email == request.email).first()
        
        if not user:
            print(f"⚠️ User not found: {request.email}")
            return JSONResponse(
                status_code=200,
                content={"success": True, "message": "If your email is registered, you will receive a reset code"}
            )
        
        reset_code = str(secrets.randbelow(900000) + 100000)
        
        # Store reset code
        email_key = request.email.lower()
        reset_codes[email_key] = {
            "code": reset_code,
            "expires_at": datetime.now() + timedelta(minutes=10),
            "user_id": user.id,
            "email": request.email
        }
        
        print(f"\n{'='*60}")
        print(f"🔐 PASSWORD RESET CODE")
        print(f"📧 Email: {request.email}")
        print(f"🔢 CODE: {reset_code}")
        print(f"⏰ Expires in 10 minutes")
        print(f"{'='*60}\n")
        
        # Try to send email
        email_sent = False
        email_error = None
        
        try:
            username = user.full_name or user.username or "User"
            html_content = get_password_reset_email_html(username, reset_code)
            
            email_result = await email_service.send_email(
                to_email=request.email,
                subject="Reset Your Password - EstateHub",
                html_content=html_content,
                text_content=f"Your password reset code is: {reset_code}\n\nThis code expires in 10 minutes."
            )
            
            if email_result["success"]:
                email_sent = True
                print(f"✅ Password reset email sent to {request.email}")
            else:
                email_error = email_result.get("message", "Unknown error")
                print(f"⚠️ Failed to send email: {email_error}")
        except Exception as e:
            email_error = str(e)
            print(f"⚠️ Email exception: {e}")
        
        # Return response
        if email_sent:
            message = "Reset code sent to your email"
        else:
            message = f"Reset code: {reset_code} (Email delivery failed. Please use this code to reset your password.)"
            print(f"⚠️ Using fallback: Code shown in console")
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True, 
                "message": message,
                "code": reset_code if not email_sent else None
            }
        )
        
    except Exception as e:
        print(f"❌ Error in forgot-password: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": str(e)}
        )


@router.post("/verify-reset-code")
async def verify_reset_code(request: VerifyResetCodeRequest):
    """Verify the reset code"""
    try:
        email_key = request.email.lower()
        print(f"🔐 Verifying code for: {request.email}")
        
        if email_key not in reset_codes:
            return JSONResponse(
                status_code=400,
                content={"valid": False, "detail": "No reset request found. Please request a new code."}
            )
        
        reset_data = reset_codes[email_key]
        
        if datetime.now() > reset_data["expires_at"]:
            del reset_codes[email_key]
            return JSONResponse(
                status_code=400,
                content={"valid": False, "detail": "Reset code has expired. Please request a new one."}
            )
        
        if reset_data["code"] != request.code:
            return JSONResponse(
                status_code=400,
                content={"valid": False, "detail": "Invalid reset code"}
            )
        
        return JSONResponse(
            status_code=200,
            content={"valid": True, "message": "Code verified successfully"}
        )
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return JSONResponse(
            status_code=500,
            content={"valid": False, "detail": str(e)}
        )


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using verified code"""
    try:
        email_key = request.email.lower()
        print(f"🔐 Resetting password for: {request.email}")
        
        if email_key not in reset_codes:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "No reset request found. Please request a new code."}
            )
        
        reset_data = reset_codes[email_key]
        
        if datetime.now() > reset_data["expires_at"]:
            del reset_codes[email_key]
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Reset code has expired. Please request a new one."}
            )
        
        if reset_data["code"] != request.code:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Invalid reset code"}
            )
        
        user = db.query(User).filter(User.id == reset_data["user_id"]).first()
        
        if not user:
            del reset_codes[email_key]
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "User not found"}
            )
        
        if len(request.new_password) < 6:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Password must be at least 6 characters"}
            )
        
        # Hash new password
        salt = bcrypt.gensalt()
        new_hashed_password = bcrypt.hashpw(request.new_password.encode('utf-8'), salt)
        user.hashed_password = new_hashed_password.decode('utf-8')
        
        db.commit()
        
        # Remove used reset code
        del reset_codes[email_key]
        
        print(f"✅ Password successfully updated for user: {user.email}")
        
        return JSONResponse(
            status_code=200,
            content={"success": True, "message": "Password reset successful"}
        )
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": str(e)}
        )


print("=" * 60)
print("📋 PASSWORD RESET ROUTES REGISTERED:")
print("   POST /api/password-reset/forgot-password")
print("   POST /api/password-reset/verify-reset-code")
print("   POST /api/password-reset/reset-password")
print("=" * 60)