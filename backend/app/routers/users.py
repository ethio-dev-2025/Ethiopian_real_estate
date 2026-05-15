from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import Optional, List
from datetime import datetime, timedelta
import os
import uuid
import json
from ..database import get_db
from ..models.user import User
from ..models.listing import Listing
from ..models.message import Message, Conversation
from ..models.settings import SystemSettings, UserSettings
from .auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Unified Dashboard"])

# ============ DASHBOARD OVERVIEW ============
@router.get("/overview")
async def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get unified dashboard overview data"""
    try:
        # User statistics
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.status == "active").count()
        
        # Listing statistics
        user_listings = db.query(Listing).filter(Listing.owner_id == current_user.id).count()
        all_listings = db.query(Listing).count()
        active_listings = db.query(Listing).filter(Listing.status == "active").count()
        
        # Message statistics
        unread_messages = db.query(Message).filter(
            Message.receiver_id == current_user.id,
            Message.is_read == False
        ).count()
        total_messages = db.query(Message).filter(
            or_(
                Message.sender_id == current_user.id,
                Message.receiver_id == current_user.id
            )
        ).count()
        
        # Recent activity
        recent_messages = db.query(Message).filter(
            or_(
                Message.sender_id == current_user.id,
                Message.receiver_id == current_user.id
            )
        ).order_by(Message.created_at.desc()).limit(5).all()
        
        recent_listings = db.query(Listing).filter(
            Listing.owner_id == current_user.id
        ).order_by(Listing.created_at.desc()).limit(5).all()
        
        # Quick stats
        pending_approvals = 0
        if current_user.role_type == "admin":
            pending_approvals = db.query(User).filter(User.status == "pending").count()
        
        return {
            "success": True,
            "user_stats": {
                "total_users": total_users,
                "active_users": active_users,
                "your_role": current_user.role_type
            },
            "listing_stats": {
                "your_listings": user_listings,
                "total_listings": all_listings,
                "active_listings": active_listings
            },
            "message_stats": {
                "unread": unread_messages,
                "total": total_messages
            },
            "pending_approvals": pending_approvals if current_user.role_type == "admin" else 0,
            "recent_activity": {
                "messages": [
                    {
                        "id": m.id,
                        "sender": m.sender.username if m.sender else "Unknown",
                        "content": m.content[:50],
                        "created_at": m.created_at.isoformat()
                    } for m in recent_messages
                ],
                "listings": [
                    {
                        "id": l.id,
                        "title": l.title,
                        "status": l.status,
                        "created_at": l.created_at.isoformat()
                    } for l in recent_listings
                ]
            }
        }
    except Exception as e:
        print(f"Error in overview: {e}")
        return {"success": False, "error": str(e)}

# ============ CREATE LISTING ============
@router.post("/listings")
async def create_listing(
    title: str,
    description: str,
    listing_type: str,
    property_type: str,
    city: str,
    price: float,
    address: Optional[str] = None,
    bedrooms: int = 0,
    bathrooms: int = 0,
    sqft: Optional[float] = None,
    features: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new property listing"""
    try:
        # Check if user is authorized to list (seller or landlord)
        if current_user.role_type not in ["seller", "landlord", "admin", "dual"]:
            raise HTTPException(status_code=403, detail="You are not authorized to create listings")
        
        # Parse features if provided
        features_list = []
        if features:
            try:
                features_list = json.loads(features)
            except:
                features_list = []
        
        new_listing = Listing(
            title=title,
            description=description,
            listing_type=listing_type,
            property_type=property_type,
            address=address,
            city=city,
            price=price,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            sqft=sqft,
            features=features_list,
            owner_id=current_user.id,
            status="pending"  # Needs admin approval
        )
        
        db.add(new_listing)
        db.commit()
        db.refresh(new_listing)
        
        return {
            "success": True,
            "message": "Listing created successfully. Awaiting admin approval.",
            "listing": new_listing.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating listing: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/listings/{listing_id}/images")
async def upload_listing_images(
    listing_id: int,
    images: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload images for a listing"""
    try:
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if listing.owner_id != current_user.id and current_user.role_type != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Create upload directory
        upload_dir = f"uploads/listings/{listing_id}"
        os.makedirs(upload_dir, exist_ok=True)
        
        uploaded_urls = []
        for image in images:
            file_extension = image.filename.split('.')[-1]
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            file_path = f"{upload_dir}/{unique_filename}"
            
            content = await image.read()
            with open(file_path, "wb") as f:
                f.write(content)
            
            uploaded_urls.append(f"/{file_path}")
        
        # Update listing images
        current_images = listing.images or []
        current_images.extend(uploaded_urls)
        listing.images = current_images
        db.commit()
        
        return {
            "success": True,
            "message": f"Uploaded {len(uploaded_urls)} images",
            "images": uploaded_urls
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error uploading images: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ MY LISTINGS ============
@router.get("/my-listings")
async def get_my_listings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    listing_type: Optional[str] = None
):
    """Get current user's listings"""
    try:
        query = db.query(Listing).filter(Listing.owner_id == current_user.id)
        
        if status:
            query = query.filter(Listing.status == status)
        if listing_type:
            query = query.filter(Listing.listing_type == listing_type)
        
        listings = query.order_by(Listing.created_at.desc()).all()
        
        return {
            "success": True,
            "listings": [l.to_dict() for l in listings],
            "total": len(listings)
        }
    except Exception as e:
        print(f"Error getting my listings: {e}")
        return {"success": False, "listings": [], "total": 0}

@router.put("/listings/{listing_id}")
async def update_listing(
    listing_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
    price: Optional[float] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a listing"""
    try:
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if listing.owner_id != current_user.id and current_user.role_type != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        
        if title:
            listing.title = title
        if description:
            listing.description = description
        if price:
            listing.price = price
        if status and current_user.role_type == "admin":
            listing.status = status
        
        db.commit()
        
        return {
            "success": True,
            "message": "Listing updated successfully",
            "listing": listing.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating listing: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/listings/{listing_id}")
async def delete_listing(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a listing (soft delete or hard delete for admin)"""
    try:
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if listing.owner_id != current_user.id and current_user.role_type != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        
        db.delete(listing)
        db.commit()
        
        return {
            "success": True,
            "message": "Listing deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting listing: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============ ACTIVATION REQUESTS ============
@router.get("/activation/status")
async def get_activation_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's activation status"""
    return {
        "success": True,
        "status": {
            "seller": {
                "approved": current_user.seller_approved,
                "submitted": current_user.seller_documents_submitted,
                "paid": current_user.seller_paid,
                "enabled": current_user.seller_enabled
            },
            "landlord": {
                "approved": current_user.landlord_approved,
                "submitted": current_user.landlord_documents_submitted,
                "paid": current_user.landlord_paid,
                "enabled": current_user.landlord_enabled
            }
        }
    }

@router.post("/activation/submit-seller")
async def submit_seller_activation(
    business_name: str,
    tax_id: str,
    business_address: str,
    business_license: UploadFile = File(...),
    ownership_document: UploadFile = File(...),
    government_id: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit seller activation request"""
    try:
        upload_dir = f"uploads/verifications/user_{current_user.id}/seller"
        os.makedirs(upload_dir, exist_ok=True)
        
        documents = []
        files_data = [
            ("business_license", business_license),
            ("ownership_document", ownership_document),
            ("government_id", government_id)
        ]
        
        for field_name, file in files_data:
            if file:
                file_extension = file.filename.split('.')[-1]
                unique_filename = f"{field_name}_{uuid.uuid4()}.{file_extension}"
                file_path = f"{upload_dir}/{unique_filename}"
                
                content = await file.read()
                with open(file_path, "wb") as f:
                    f.write(content)
                documents.append(file_path)
        
        current_user.seller_documents_submitted = True
        current_user.seller_approved = False
        current_user.company = business_name
        current_user.bio = f"Tax ID: {tax_id}\nAddress: {business_address}"
        current_user.status = "pending"
        
        db.commit()
        
        return {
            "success": True,
            "message": "Seller activation request submitted. Awaiting admin approval."
        }
    except Exception as e:
        print(f"Error submitting seller activation: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/activation/submit-landlord")
async def submit_landlord_activation(
    property_address: str,
    property_title_deed: UploadFile = File(...),
    property_tax_clearance: UploadFile = File(...),
    government_id: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit landlord activation request"""
    try:
        upload_dir = f"uploads/verifications/user_{current_user.id}/landlord"
        os.makedirs(upload_dir, exist_ok=True)
        
        files_data = [
            ("property_title_deed", property_title_deed),
            ("property_tax_clearance", property_tax_clearance),
            ("government_id", government_id)
        ]
        
        for field_name, file in files_data:
            if file:
                file_extension = file.filename.split('.')[-1]
                unique_filename = f"{field_name}_{uuid.uuid4()}.{file_extension}"
                file_path = f"{upload_dir}/{unique_filename}"
                
                content = await file.read()
                with open(file_path, "wb") as f:
                    f.write(content)
        
        current_user.landlord_documents_submitted = True
        current_user.landlord_approved = False
        current_user.city = property_address
        current_user.status = "pending"
        
        db.commit()
        
        return {
            "success": True,
            "message": "Landlord activation request submitted. Awaiting admin approval."
        }
    except Exception as e:
        print(f"Error submitting landlord activation: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============ MESSAGES ============
@router.get("/messages")
async def get_messages(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    conversation_id: Optional[int] = None
):
    """Get messages for current user"""
    try:
        if conversation_id:
            # Get specific conversation
            messages = db.query(Message).filter(
                Message.id == conversation_id,
                or_(
                    Message.sender_id == current_user.id,
                    Message.receiver_id == current_user.id
                )
            ).order_by(Message.created_at).all()
        else:
            # Get all conversations
            conversations = db.query(Conversation).filter(
                or_(
                    Conversation.user1_id == current_user.id,
                    Conversation.user2_id == current_user.id
                )
            ).order_by(Conversation.last_message_at.desc()).all()
            
            return {
                "success": True,
                "conversations": [
                    {
                        "id": c.id,
                        "other_user_id": c.user2_id if c.user1_id == current_user.id else c.user1_id,
                        "last_message": c.last_message,
                        "last_message_at": c.last_message_at.isoformat(),
                        "listing_id": c.listing_id
                    } for c in conversations
                ]
            }
        
        return {
            "success": True,
            "messages": [m.to_dict() for m in messages]
        }
    except Exception as e:
        print(f"Error getting messages: {e}")
        return {"success": False, "messages": []}

@router.post("/messages/send")
async def send_message(
    receiver_id: int,
    content: str,
    listing_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message to another user"""
    try:
        receiver = db.query(User).filter(User.id == receiver_id).first()
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver not found")
        
        new_message = Message(
            sender_id=current_user.id,
            receiver_id=receiver_id,
            listing_id=listing_id,
            content=content,
            is_read=False
        )
        db.add(new_message)
        
        # Update or create conversation
        conversation = db.query(Conversation).filter(
            or_(
                and_(Conversation.user1_id == current_user.id, Conversation.user2_id == receiver_id),
                and_(Conversation.user1_id == receiver_id, Conversation.user2_id == current_user.id)
            )
        ).first()
        
        if not conversation:
            conversation = Conversation(
                user1_id=min(current_user.id, receiver_id),
                user2_id=max(current_user.id, receiver_id),
                listing_id=listing_id
            )
            db.add(conversation)
        
        conversation.last_message = content
        conversation.last_message_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "success": True,
            "message": "Message sent successfully",
            "data": new_message.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sending message: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/messages/{message_id}/read")
async def mark_message_read(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a message as read"""
    try:
        message = db.query(Message).filter(Message.id == message_id).first()
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        if message.receiver_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        message.is_read = True
        message.read_at = datetime.utcnow()
        db.commit()
        
        return {"success": True, "message": "Message marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error marking message read: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============ SETTINGS ============
@router.get("/settings")
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user settings"""
    try:
        user_settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
        
        if not user_settings:
            user_settings = UserSettings(user_id=current_user.id)
            db.add(user_settings)
            db.commit()
        
        return {
            "success": True,
            "settings": {
                "theme": user_settings.theme,
                "language": user_settings.language,
                "notifications_enabled": user_settings.notifications_enabled,
                "email_notifications": user_settings.email_notifications,
                "two_factor_enabled": user_settings.two_factor_enabled,
                "preferences": user_settings.preferences
            }
        }
    except Exception as e:
        print(f"Error getting settings: {e}")
        return {"success": False, "error": str(e)}

@router.put("/settings")
async def update_settings(
    theme: Optional[str] = None,
    language: Optional[str] = None,
    notifications_enabled: Optional[bool] = None,
    email_notifications: Optional[bool] = None,
    preferences: Optional[dict] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user settings"""
    try:
        user_settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
        
        if not user_settings:
            user_settings = UserSettings(user_id=current_user.id)
            db.add(user_settings)
        
        if theme is not None:
            user_settings.theme = theme
        if language is not None:
            user_settings.language = language
        if notifications_enabled is not None:
            user_settings.notifications_enabled = notifications_enabled
        if email_notifications is not None:
            user_settings.email_notifications = email_notifications
        if preferences is not None:
            user_settings.preferences = preferences
        
        db.commit()
        
        return {"success": True, "message": "Settings updated successfully"}
    except Exception as e:
        print(f"Error updating settings: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/settings/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        if not pwd_context.verify(current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        current_user.hashed_password = pwd_context.hash(new_password)
        db.commit()
        
        return {"success": True, "message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error changing password: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))