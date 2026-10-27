from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import bcrypt
import json
from ..database import get_db
from ..models import User
from .auth import get_current_user

router = APIRouter()

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    company: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    avatar_url: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class NotificationPrefs(BaseModel):
    email_notifications: bool = True
    push_notifications: bool = True
    message_alerts: bool = True
    listing_alerts: bool = True
    payment_alerts: bool = True

class Preferences(BaseModel):
    language: str = "en"
    timezone: str = "Africa/Addis_Ababa"
    currency: str = "USD"

@router.get("/")
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all user settings"""
    preferences = {}
    if current_user.extra_data:
        try:
            preferences = json.loads(current_user.extra_data)
        except:
            preferences = {}
    
    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "phone": current_user.phone,
            "bio": current_user.bio,
            "company": current_user.company,
            "city": current_user.city,
            "region": current_user.region,
            "avatar_url": current_user.avatar_url
        },
        "notification_prefs": {
            "email_notifications": preferences.get("email_notifications", True),
            "push_notifications": preferences.get("push_notifications", True),
            "message_alerts": preferences.get("message_alerts", True),
            "listing_alerts": preferences.get("listing_alerts", True),
            "payment_alerts": preferences.get("payment_alerts", True)
        },
        "preferences": {
            "language": preferences.get("language", "en"),
            "timezone": preferences.get("timezone", "Africa/Addis_Ababa"),
            "currency": preferences.get("currency", "USD")
        }
    }

@router.put("/profile")
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    try:
        if profile_data.full_name is not None:
            current_user.full_name = profile_data.full_name
        if profile_data.phone is not None:
            current_user.phone = profile_data.phone
        if profile_data.bio is not None:
            current_user.bio = profile_data.bio
        if profile_data.company is not None:
            current_user.company = profile_data.company
        if profile_data.city is not None:
            current_user.city = profile_data.city
        if profile_data.region is not None:
            current_user.region = profile_data.region
        if profile_data.avatar_url is not None:
            current_user.avatar_url = profile_data.avatar_url
        
        db.commit()
        db.refresh(current_user)
        
        return {
            "success": True,
            "message": "Profile updated successfully",
            "user": {
                "id": current_user.id,
                "email": current_user.email,
                "full_name": current_user.full_name,
                "phone": current_user.phone,
                "bio": current_user.bio,
                "company": current_user.company,
                "city": current_user.city,
                "region": current_user.region,
                "avatar_url": current_user.avatar_url
            }
        }
    except Exception as e:
        print(f"Error updating profile: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    try:
        print(f"=" * 50)
        print(f"Password change request for user: {current_user.email}")
        print(f"Current password provided: {password_data.current_password[:3]}...")
        print(f"New password length: {len(password_data.new_password)}")
        
        # Verify current password
        is_valid = bcrypt.checkpw(
            password_data.current_password.encode('utf-8'),
            current_user.hashed_password.encode('utf-8')
        )
        
        print(f"Password validation result: {is_valid}")
        
        if not is_valid:
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Validate new password length
        if len(password_data.new_password) < 6:
            raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
        
        # Hash new password
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_data.new_password.encode('utf-8'), salt)
        current_user.hashed_password = hashed.decode('utf-8')
        
        db.commit()
        
        print(f"✅ Password changed successfully for {current_user.email}")
        print(f"=" * 50)
        
        return {"success": True, "message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error changing password: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/notifications")
async def update_notification_prefs(
    prefs: NotificationPrefs,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update notification preferences"""
    try:
        preferences = {}
        if current_user.extra_data:
            try:
                preferences = json.loads(current_user.extra_data)
            except:
                pass
        
        preferences["email_notifications"] = prefs.email_notifications
        preferences["push_notifications"] = prefs.push_notifications
        preferences["message_alerts"] = prefs.message_alerts
        preferences["listing_alerts"] = prefs.listing_alerts
        preferences["payment_alerts"] = prefs.payment_alerts
        
        current_user.extra_data = json.dumps(preferences)
        db.commit()
        
        return {"success": True, "message": "Notification preferences updated"}
    except Exception as e:
        print(f"Error updating notification prefs: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/preferences")
async def update_preferences(
    preferences_data: Preferences,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user preferences"""
    try:
        preferences = {}
        if current_user.extra_data:
            try:
                preferences = json.loads(current_user.extra_data)
            except:
                pass
        
        preferences["language"] = preferences_data.language
        preferences["timezone"] = preferences_data.timezone
        preferences["currency"] = preferences_data.currency
        
        current_user.extra_data = json.dumps(preferences)
        db.commit()
        
        return {"success": True, "message": "Preferences updated successfully"}
    except Exception as e:
        print(f"Error updating preferences: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))