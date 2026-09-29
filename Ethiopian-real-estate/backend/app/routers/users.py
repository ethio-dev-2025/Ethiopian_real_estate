from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
import shutil
from pydantic import BaseModel
from passlib.context import CryptContext
from ..database import get_db
from ..models.user import User
from .auth import get_current_user

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ============ PYDANTIC MODELS ============
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user's password"""
    try:
        print(f"🔐 Changing password for user: {current_user.email}")
        print(f"   Provided current password length: {len(password_data.current_password)}")
        print(f"   Stored hash: {current_user.hashed_password[:50]}...")
        
        # Verify current password - FIXED verification
        is_valid = pwd_context.verify(password_data.current_password, current_user.hashed_password)
        print(f"   Password valid: {is_valid}")
        
        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail="Current password is incorrect"
            )
        
        # Validate new password length
        if len(password_data.new_password) < 6:
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 6 characters"
            )
        
        # Check that new password is different from current
        if pwd_context.verify(password_data.new_password, current_user.hashed_password):
            raise HTTPException(
                status_code=400,
                detail="New password must be different from current password"
            )
        
        # Hash new password
        hashed_new_password = pwd_context.hash(password_data.new_password)
        
        # Update user's password
        current_user.hashed_password = hashed_new_password
        
        db.commit()
        
        print(f"✅ Password changed successfully for user: {current_user.email}")
        
        return {
            "success": True,
            "message": "Password changed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error changing password: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ UPDATE PROFILE SETTINGS ============
@router.put("/update-profile-settings")
async def update_profile_settings(
    profile_data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's profile information"""
    try:
        print(f"=== UPDATING PROFILE ===")
        print(f"User ID: {current_user.id}")
        print(f"Email: {current_user.email}")
        
        if profile_data.full_name is not None:
            current_user.full_name = profile_data.full_name
        if profile_data.phone is not None:
            current_user.phone = profile_data.phone
        if profile_data.date_of_birth is not None:
            current_user.date_of_birth = profile_data.date_of_birth
        if profile_data.city is not None:
            current_user.city = profile_data.city
        if profile_data.address is not None:
            current_user.address = profile_data.address
        if profile_data.bio is not None:
            current_user.bio = profile_data.bio
        if profile_data.position is not None:
            current_user.position = profile_data.position
        if profile_data.department is not None:
            current_user.department = profile_data.department
        
        db.commit()
        db.refresh(current_user)
        
        return {
            "success": True,
            "message": "Profile updated successfully",
            "user": {
                "id": current_user.id,
                "full_name": current_user.full_name,
                "phone": current_user.phone,
                "date_of_birth": current_user.date_of_birth,
                "city": current_user.city,
                "address": current_user.address,
                "bio": current_user.bio,
                "position": current_user.position,
                "department": current_user.department,
                "avatar_url": current_user.avatar_url,
                "email": current_user.email,
                "username": current_user.username
            }
        }
        
    except Exception as e:
        print(f"Error updating profile: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ UPLOAD PROFILE PICTURE ============
@router.post("/upload-profile-picture")
async def upload_profile_picture(
    profile_picture: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload profile picture for user"""
    try:
        if not profile_picture.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        profile_picture.file.seek(0, 2)
        file_size = profile_picture.file.tell()
        profile_picture.file.seek(0)
        
        if file_size > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max 5MB")
        
        upload_dir = f"uploads/profiles/user_{current_user.id}"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Remove old profile picture if exists
        if current_user.avatar_url:
            old_file_path = os.path.join(".", current_user.avatar_url.lstrip('/'))
            if os.path.exists(old_file_path):
                try:
                    os.remove(old_file_path)
                except:
                    pass
        
        file_extension = profile_picture.filename.split('.')[-1]
        unique_filename = f"profile_{current_user.id}_{uuid.uuid4().hex}.{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(profile_picture.file, buffer)
        
        avatar_url = f"/uploads/profiles/user_{current_user.id}/{unique_filename}"
        current_user.avatar_url = avatar_url
        db.commit()
        db.refresh(current_user)
        
        return {
            "success": True,
            "profile_picture_url": avatar_url,
            "message": "Profile picture updated successfully"
        }
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ REMOVE PROFILE PICTURE ============
@router.delete("/remove-profile-picture")
async def remove_profile_picture(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove profile picture"""
    try:
        if current_user.avatar_url:
            file_path = os.path.join(".", current_user.avatar_url.lstrip('/'))
            if os.path.exists(file_path):
                os.remove(file_path)
            current_user.avatar_url = None
            db.commit()
            db.refresh(current_user)
        
        return {"success": True, "message": "Profile picture removed successfully"}
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ GET USER PROFILE ============
@router.get("/profile")
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile"""
    try:
        return {
            "success": True,
            "user": {
                "id": current_user.id,
                "email": current_user.email,
                "username": current_user.username,
                "full_name": current_user.full_name,
                "phone": current_user.phone,
                "city": current_user.city,
                "region": current_user.region,
                "address": current_user.address,
                "date_of_birth": getattr(current_user, 'date_of_birth', None),
                "bio": getattr(current_user, 'bio', None),
                "avatar_url": current_user.avatar_url,
                "role_type": current_user.role_type,
                "is_activated": current_user.is_activated,
                "is_verified": current_user.is_verified
            }
        }
    except Exception as e:
        print(f"Error: {e}")
        return {"success": False, "error": str(e)}


# ============ GET USER BY EMAIL ============
@router.get("/by-email")
async def get_user_by_email(
    email: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user by email (for sellers to find buyers/renters)"""
    try:
        # Only admins and sellers can search for users
        if current_user.role_type not in ['admin', 'seller', 'dual']:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "phone": user.phone,
            "role_type": user.role_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error finding user by email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ GET USER BY USERNAME ============
@router.get("/by-username")
async def get_user_by_username(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user by username (for sellers to find buyers/renters)"""
    try:
        # Only admins and sellers can search for users
        if current_user.role_type not in ['admin', 'seller', 'dual']:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        user = db.query(User).filter(User.username == username).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "phone": user.phone,
            "role_type": user.role_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error finding user by username: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ RESET ADMIN PASSWORD (Temporary) ============
@router.post("/reset-admin-password")
async def reset_admin_password(db: Session = Depends(get_db)):
    """Temporary endpoint to reset admin password"""
    admin = db.query(User).filter(User.id == 2).first()
    if admin:
        new_password = "admin123"
        admin.hashed_password = pwd_context.hash(new_password)
        db.commit()
        return {"success": True, "message": f"Password reset to {new_password} for {admin.email}"}
    return {"success": False, "message": "Admin not found"}


print("✅ Users router loaded successfully!")