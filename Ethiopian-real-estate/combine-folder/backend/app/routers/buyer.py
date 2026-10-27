# backend/app/routers/buyer.py - COMPLETE FIXED VERSION
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from typing import Optional
import json
from datetime import datetime
from ..database import get_db
from ..models import User, Listing, Message, Conversation, SavedProperty
from ..config import settings
from .auth import get_current_user, get_current_buyer_user
import jwt
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# ============ PUBLIC PROPERTIES ============
@router.get("/properties")
async def get_all_properties(
    db: Session = Depends(get_db),
    listing_type: Optional[str] = None,
    property_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    bedrooms: Optional[int] = None,
    bathrooms: Optional[int] = None,
    city: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    try:
        query = db.query(Listing).filter(
            Listing.is_draft == False,
            Listing.status == "active"
        )
        
        if listing_type:
            query = query.filter(Listing.listing_type == listing_type)
        if property_type:
            query = query.filter(Listing.property_type == property_type)
        if min_price:
            query = query.filter(Listing.price >= min_price)
        if max_price:
            query = query.filter(Listing.price <= max_price)
        if bedrooms:
            query = query.filter(Listing.bedrooms >= bedrooms)
        if bathrooms:
            query = query.filter(Listing.bathrooms >= bathrooms)
        if city:
            query = query.filter(Listing.city.ilike(f"%{city}%"))
        if search:
            query = query.filter(
                or_(
                    Listing.title.ilike(f"%{search}%"),
                    Listing.description.ilike(f"%{search}%"),
                    Listing.address.ilike(f"%{search}%")
                )
            )
        
        total = query.count()
        listings = query.order_by(desc(Listing.created_at)).offset(offset).limit(limit).all()
        
        result = []
        for listing in listings:
            images = []
            if listing.images:
                try:
                    images = json.loads(listing.images) if isinstance(listing.images, str) else listing.images
                except:
                    images = []
            
            result.append({
                "id": listing.id,
                "title": listing.title,
                "description": listing.description[:200] if listing.description else "",
                "price": listing.price,
                "listing_type": listing.listing_type,
                "property_type": listing.property_type,
                "bedrooms": listing.bedrooms,
                "bathrooms": listing.bathrooms,
                "sqft": listing.sqft,
                "address": listing.address,
                "city": listing.city,
                "images": images[:3],
                "cover_image": listing.cover_image,
                "featured": listing.featured,
                "latitude": listing.latitude,
                "longitude": listing.longitude,
                "listing_status": listing.listing_status,
                "created_at": listing.created_at.isoformat() if listing.created_at else None
            })
        
        return {
            "total": total,
            "properties": result,
            "has_more": offset + limit < total
        }
        
    except Exception as e:
        print(f"Error: {e}")
        return {"total": 0, "properties": [], "has_more": False}


# ============ GET SINGLE PROPERTY ============
@router.get("/properties/{property_id}")
async def get_property_detail(
    property_id: int,
    db: Session = Depends(get_db)
):
    try:
        listing = db.query(Listing).filter(
            Listing.id == property_id,
            Listing.is_draft == False,
            Listing.status == "active"
        ).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Property not found")
        
        listing.views_count = (listing.views_count or 0) + 1
        db.commit()
        
        images = []
        if listing.images:
            try:
                images = json.loads(listing.images) if isinstance(listing.images, str) else listing.images
            except:
                images = []
        
        amenities = []
        if listing.amenities:
            try:
                amenities = json.loads(listing.amenities) if isinstance(listing.amenities, str) else listing.amenities
            except:
                amenities = []
        
        owner = db.query(User).filter(User.id == listing.user_id).first()
        
        return {
            "id": listing.id,
            "title": listing.title,
            "description": listing.description,
            "price": listing.price,
            "listing_type": listing.listing_type,
            "property_type": listing.property_type,
            "bedrooms": listing.bedrooms,
            "bathrooms": listing.bathrooms,
            "sqft": listing.sqft,
            "year_built": listing.year_built,
            "address": listing.address,
            "city": listing.city,
            "region": listing.region,
            "sub_city": listing.sub_city,
            "images": images,
            "cover_image": listing.cover_image,
            "amenities": amenities,
            "phone_number": listing.phone_number,
            "email": listing.email,
            "owner_id": owner.id if owner else None,
            "owner_name": owner.full_name or owner.username if owner else "Unknown",
            "views_count": listing.views_count,
            "featured": listing.featured,
            "listing_status": listing.listing_status,
            "latitude": listing.latitude,
            "longitude": listing.longitude,
            "created_at": listing.created_at.isoformat() if listing.created_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ GET PROPERTY OWNER FOR CHAT ============
@router.get("/property-owner/{property_id}")
async def get_property_owner(
    property_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        token = auth_header.split(" ")[1]
        
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            email = payload.get("sub")
            if not email:
                raise HTTPException(status_code=401, detail="Invalid token")
            
            current_user = db.query(User).filter(User.email == email).first()
            if not current_user:
                raise HTTPException(status_code=401, detail="User not found")
                
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        property_obj = db.query(Listing).filter(Listing.id == property_id).first()
        if not property_obj:
            raise HTTPException(status_code=404, detail="Property not found")
        
        owner = db.query(User).filter(User.id == property_obj.user_id).first()
        if not owner:
            raise HTTPException(status_code=404, detail="Owner not found")
        
        if owner.id == current_user.id:
            return {"success": False, "error": "You cannot message yourself"}
        
        # Get or create conversation
        conversation = db.query(Conversation).filter(
            or_(
                and_(Conversation.buyer_id == current_user.id, Conversation.seller_id == owner.id),
                and_(Conversation.buyer_id == owner.id, Conversation.seller_id == current_user.id)
            )
        ).first()
        
        if not conversation:
            conversation = Conversation(
                buyer_id=current_user.id,
                seller_id=owner.id,
                property_id=property_id,
                last_message_time=datetime.utcnow(),
                buyer_unread=0,
                seller_unread=0
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
        
        return {
            "success": True,
            "owner_id": owner.id,
            "owner_name": owner.full_name or owner.username,
            "conversation_id": conversation.id,
            "property_title": property_obj.title,
            "property_id": property_obj.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ GET CONVERSATIONS ============
@router.get("/conversations")
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        conversations = db.query(Conversation).filter(
            or_(
                Conversation.buyer_id == current_user.id,
                Conversation.seller_id == current_user.id
            )
        ).order_by(desc(Conversation.updated_at)).all()
        
        result = []
        for conv in conversations:
            other_user_id = conv.seller_id if conv.buyer_id == current_user.id else conv.buyer_id
            other_user = db.query(User).filter(User.id == other_user_id).first()
            property_obj = db.query(Listing).filter(Listing.id == conv.property_id).first()
            
            unread_count = conv.buyer_unread if conv.buyer_id == current_user.id else conv.seller_unread
            
            result.append({
                "id": conv.id,
                "property_id": conv.property_id,
                "property_title": property_obj.title if property_obj else "Property",
                "user_id": other_user_id,
                "user_name": other_user.full_name or other_user.username if other_user else "User",
                "user_role": other_user.role_type if other_user else "user",
                "last_message": conv.last_message or "No messages yet",
                "last_message_at": conv.last_message_time.isoformat() if conv.last_message_time else None,
                "unread_count": unread_count or 0
            })
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting conversations: {e}")
        return []


# ============ GET MESSAGE RECIPIENTS (FIXED - Only Admin + Users with Existing Conversations) ============
@router.get("/users")
async def get_buyer_message_recipients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get users that buyers can message:
    - Admin users (always)
    - Users they already have conversations with (sellers/landlords they've contacted)
    - Does NOT show all sellers/landlords in the system
    """
    try:
        # Get all admin users (excluding current user)
        admin_users = db.query(User).filter(
            User.id != current_user.id,
            User.status == "active",
            User.role_type == 'admin'
        ).order_by(User.full_name.asc()).all()
        
        # Get users that the buyer already has conversations with
        existing_conversations = db.query(Conversation).filter(
            or_(
                Conversation.buyer_id == current_user.id,
                Conversation.seller_id == current_user.id
            )
        ).all()
        
        # Extract unique user IDs from existing conversations
        conversation_user_ids = set()
        for conv in existing_conversations:
            other_user_id = conv.seller_id if conv.buyer_id == current_user.id else conv.buyer_id
            conversation_user_ids.add(other_user_id)
        
        # Get users from existing conversations
        conversation_users = []
        if conversation_user_ids:
            conversation_users = db.query(User).filter(
                User.id.in_(conversation_user_ids),
                User.status == "active"
            ).all()
        
        # Combine admin users and conversation users (no duplicates)
        all_recipients = admin_users + conversation_users
        
        # Remove duplicates by user_id
        unique_recipients = {}
        for user in all_recipients:
            if user.id not in unique_recipients:
                unique_recipients[user.id] = user
        
        result = []
        for user in unique_recipients.values():
            # Get the latest conversation with this user
            existing_conv = db.query(Conversation).filter(
                or_(
                    and_(Conversation.buyer_id == current_user.id, Conversation.seller_id == user.id),
                    and_(Conversation.buyer_id == user.id, Conversation.seller_id == current_user.id)
                )
            ).first()
            
            # Count active listings for this user (if they are a seller/landlord)
            active_listing_count = 0
            if user.role_type in ['seller', 'landlord', 'dual']:
                active_listing_count = db.query(Listing).filter(
                    Listing.user_id == user.id,
                    Listing.is_draft == False,
                    Listing.status == "active"
                ).count()
            
            result.append({
                "id": user.id,
                "user_id": user.id,
                "user_name": user.full_name or user.username,
                "user_role": user.role_type,
                "user_avatar": user.avatar_url,
                "email": user.email,
                "last_message": existing_conv.last_message if existing_conv else None,
                "last_message_at": existing_conv.last_message_time.isoformat() if existing_conv and existing_conv.last_message_time else None,
                "unread_count": existing_conv.buyer_unread if existing_conv and existing_conv.buyer_id == current_user.id else (existing_conv.seller_unread if existing_conv else 0),
                "is_online": False,
                "conversation_id": existing_conv.id if existing_conv else None,
                "active_listing_count": active_listing_count
            })
        
        # Sort by last_message_at (most recent first)
        result.sort(key=lambda x: x.get('last_message_at') or '', reverse=True)
        
        print(f"✅ Buyer message recipients: {len(result)} users (Admins + existing conversations only)")
        return result
        
    except Exception as e:
        logger.error(f"Error getting message recipients: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ GET MESSAGES ============
@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if conv.buyer_id != current_user.id and conv.seller_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        if conv.buyer_id == current_user.id:
            conv.buyer_unread = 0
        else:
            conv.seller_unread = 0
        db.commit()
        
        messages = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at.asc()).all()
        
        result = []
        for msg in messages:
            sender = db.query(User).filter(User.id == msg.sender_id).first()
            result.append({
                "id": msg.id,
                "sender_id": msg.sender_id,
                "sender_name": sender.full_name or sender.username if sender else "User",
                "receiver_id": msg.receiver_id,
                "message": msg.content,
                "is_read": msg.is_read,
                "is_mine": msg.sender_id == current_user.id,
                "created_at": msg.created_at.isoformat(),
                "time": msg.created_at.strftime("%I:%M %p") if msg.created_at else ""
            })
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ SEND MESSAGE ============
@router.post("/send-message")
async def send_message(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        conversation_id = data.get("conversation_id")
        message_content = data.get("message", "").strip()
        
        if not conversation_id:
            raise HTTPException(status_code=400, detail="Conversation ID required")
        
        if not message_content:
            raise HTTPException(status_code=400, detail="Message content required")
        
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if conv.buyer_id != current_user.id and conv.seller_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        receiver_id = conv.seller_id if conv.buyer_id == current_user.id else conv.buyer_id
        
        new_message = Message(
            conversation_id=conversation_id,
            sender_id=current_user.id,
            receiver_id=receiver_id,
            content=message_content,
            created_at=datetime.utcnow()
        )
        db.add(new_message)
        db.commit()
        db.refresh(new_message)
        
        conv.last_message = message_content[:100]
        conv.last_message_time = datetime.utcnow()
        conv.updated_at = datetime.utcnow()
        
        if conv.buyer_id == receiver_id:
            conv.buyer_unread = (conv.buyer_unread or 0) + 1
        else:
            conv.seller_unread = (conv.seller_unread or 0) + 1
        db.commit()
        
        return {"success": True, "message": "Message sent successfully"}
        
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ SAVED PROPERTIES ============
@router.get("/saved-properties")
async def get_saved_properties(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        saved = db.query(SavedProperty).filter(
            SavedProperty.user_id == current_user.id
        ).order_by(desc(SavedProperty.saved_at)).all()
        
        properties = []
        for item in saved:
            listing = db.query(Listing).filter(Listing.id == item.property_id).first()
            if listing:
                images = []
                if listing.images:
                    try:
                        images = json.loads(listing.images) if isinstance(listing.images, str) else listing.images
                    except:
                        images = []
                
                properties.append({
                    "id": listing.id,
                    "title": listing.title,
                    "price": listing.price,
                    "listing_type": listing.listing_type,
                    "bedrooms": listing.bedrooms,
                    "bathrooms": listing.bathrooms,
                    "sqft": listing.sqft,
                    "address": listing.address,
                    "city": listing.city,
                    "images": images[:3],
                    "cover_image": listing.cover_image,
                    "latitude": listing.latitude,
                    "longitude": listing.longitude,
                    "saved_at": item.saved_at.isoformat() if item.saved_at else None
                })
        
        return properties
        
    except Exception as e:
        logger.error(f"Error getting saved properties: {e}")
        return []


@router.post("/save-property/{property_id}")
async def save_property(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        existing = db.query(SavedProperty).filter(
            SavedProperty.user_id == current_user.id,
            SavedProperty.property_id == property_id
        ).first()
        
        if existing:
            return {"success": True, "saved": True, "message": "Already saved"}
        
        new_saved = SavedProperty(
            user_id=current_user.id,
            property_id=property_id,
            saved_at=datetime.utcnow()
        )
        db.add(new_saved)
        db.commit()
        
        return {"success": True, "saved": True, "message": "Property saved"}
        
    except Exception as e:
        logger.error(f"Error saving property: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/unsave-property/{property_id}")
async def unsave_property(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        saved = db.query(SavedProperty).filter(
            SavedProperty.user_id == current_user.id,
            SavedProperty.property_id == property_id
        ).first()
        
        if saved:
            db.delete(saved)
            db.commit()
        
        return {"success": True, "saved": False, "message": "Property removed"}
        
    except Exception as e:
        logger.error(f"Error unsaving property: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/is-saved/{property_id}")
async def is_property_saved(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        saved = db.query(SavedProperty).filter(
            SavedProperty.user_id == current_user.id,
            SavedProperty.property_id == property_id
        ).first()
        
        return {"success": True, "saved": saved is not None}
        
    except Exception as e:
        return {"success": False, "saved": False}


print("✅ Buyer router loaded with FIXED recipient filtering - ONLY Admins + Existing Conversations!")