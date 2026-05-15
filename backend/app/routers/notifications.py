from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
import json
from ..database import get_db
from ..models import User, Notification
from .auth import get_current_user

router = APIRouter()

class NotificationCreate(BaseModel):
    user_id: int
    type: str
    title: str
    message: str
    link: Optional[str] = None
    icon: Optional[str] = None
    extra_data: Optional[dict] = None

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    message: str
    is_read: bool
    link: Optional[str]
    icon: Optional[str]
    extra_data: Optional[dict]
    created_at: str

@router.get("/")
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False)
):
    """Get notifications for current user"""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()
    
    result = []
    for n in notifications:
        result.append({
            "id": n.id,
            "user_id": n.user_id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "link": n.link,
            "icon": n.icon,
            "extra_data": json.loads(n.extra_data) if n.extra_data else None,
            "created_at": n.created_at.isoformat()
        })
    
    return result

@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get unread notification count"""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"unread_count": count}

@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a single notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    
    return {"message": "Notification marked as read"}

@router.post("/read-all")
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    
    return {"message": "All notifications marked as read"}

@router.delete("/clear-read")
async def clear_read_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete all read notifications"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == True
    ).delete()
    db.commit()
    
    return {"message": "Read notifications cleared"}

@router.post("/create")
async def create_notification(
    notification_data: NotificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new notification (admin only or system)"""
    # Only admin can create notifications manually
    if current_user.role_type != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    new_notification = Notification(
        user_id=notification_data.user_id,
        type=notification_data.type,
        title=notification_data.title,
        message=notification_data.message,
        link=notification_data.link,
        icon=notification_data.icon,
        extra_data=json.dumps(notification_data.extra_data) if notification_data.extra_data else None
    )
    
    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)
    
    return {
        "id": new_notification.id,
        "user_id": new_notification.user_id,
        "type": new_notification.type,
        "title": new_notification.title,
        "message": new_notification.message,
        "is_read": new_notification.is_read,
        "link": new_notification.link,
        "icon": new_notification.icon,
        "created_at": new_notification.created_at.isoformat()
    }

# Helper function to create notifications from other parts of the app
def create_notification_helper(db: Session, user_id: int, type: str, title: str, message: str, link: str = None, icon: str = None, extra_data: dict = None):
    """Helper function to create notifications"""
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        link=link,
        icon=icon,
        extra_data=json.dumps(extra_data) if extra_data else None
    )
    db.add(notification)
    db.commit()
    return notification
