# backend/app/routers/admin_notifications.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models.user import User
from .auth import get_current_admin_user

router = APIRouter()

class NotificationSettings(BaseModel):
    email_alerts: bool = True
    new_user_notifications: bool = True
    payment_notifications: bool = True

@router.get("/notification-settings")
async def get_notification_settings(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get admin notification settings"""
    try:
        return {
            "email_alerts": getattr(current_user, 'email_alerts', True),
            "new_user_notifications": getattr(current_user, 'new_user_notifications', True),
            "payment_notifications": getattr(current_user, 'payment_notifications', True)
        }
    except Exception as e:
        print(f"Error getting notification settings: {e}")
        return {"email_alerts": True, "new_user_notifications": True, "payment_notifications": True}

@router.put("/notification-settings")
async def update_notification_settings(
    settings: NotificationSettings,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update admin notification settings"""
    try:
        current_user.email_alerts = settings.email_alerts
        current_user.new_user_notifications = settings.new_user_notifications
        current_user.payment_notifications = settings.payment_notifications
        
        db.commit()
        db.refresh(current_user)
        
        return {
            "success": True,
            "message": "Notification settings updated",
            "settings": {
                "email_alerts": current_user.email_alerts,
                "new_user_notifications": current_user.new_user_notifications,
                "payment_notifications": current_user.payment_notifications
            }
        }
    except Exception as e:
        print(f"Error updating notification settings: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))