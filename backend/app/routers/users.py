# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
import shutil
from ..database import get_db
from ..models.user import User
from .auth import get_current_user

router = APIRouter()


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


@router.put("/update-profile-settings")
async def update_profile_settings(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile settings"""
    try:
        body = await request.json()
        
        full_name = body.get('full_name')
        phone = body.get('phone')
        date_of_birth = body.get('date_of_birth')
        city = body.get('city')
        address = body.get('address')
        bio = body.get('bio')
        
        print(f"Updating profile for user: {current_user.email}")
        print(f"New date_of_birth: {date_of_birth}")
        
        if full_name is not None:
            current_user.full_name = full_name
        if phone is not None:
            current_user.phone = phone
        if date_of_birth is not None:
            current_user.date_of_birth = date_of_birth
        if city is not None:
            current_user.city = city
        if address is not None:
            current_user.address = address
        if bio is not None:
            current_user.bio = bio
        
        db.commit()
        db.refresh(current_user)
        
        print(f"Updated date_of_birth in DB: {current_user.date_of_birth}")
        
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
                "avatar_url": current_user.avatar_url,
                "email": current_user.email,
                "username": current_user.username
            }
        }
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/change-password")
async def change_password(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    try:
        body = await request.json()
        current_password = body.get('current_password')
        new_password = body.get('new_password')
        
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        is_valid = pwd_context.verify(current_password, current_user.hashed_password)
        
        if not is_valid:
            return {
                "success": False,
                "message": "Current password is incorrect"
            }
        
        if len(new_password) < 6:
            return {
                "success": False,
                "message": "New password must be at least 6 characters"
            }
        
        current_user.hashed_password = pwd_context.hash(new_password)
        db.commit()
        
        return {
            "success": True,
            "message": "Password changed successfully"
        }
        
    except Exception as e:
        print(f"Error changing password: {e}")
        db.rollback()
        return {
            "success": False,
            "message": str(e)
        }


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


print("✅ Users router loaded successfully!")