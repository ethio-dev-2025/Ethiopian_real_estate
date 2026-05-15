from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from typing import Optional, List
import json
from datetime import datetime
from ..database import get_db
from ..models import User, Listing, Message, Conversation, SavedProperty
from ..config import settings
from .auth import get_current_user
import jwt
import logging

router = APIRouter()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============ GET ALL PROPERTIES FOR BUYERS ============
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
    """Get all public listings for buyers (no authentication required)"""
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
                "created_at": listing.created_at.isoformat() if listing.created_at else None
            })
        
        return {
            "total": total,
            "properties": result,
            "has_more": len(result) < total
        }
        
    except Exception as e:
        print(f"Error getting properties: {e}")
        return {"total": 0, "properties": [], "has_more": False}


# ============ GET SINGLE PROPERTY DETAIL ============
@router.get("/properties/{property_id}")
async def get_property_detail(
    property_id: int,
    db: Session = Depends(get_db)
):
    """Get single property details for buyers (no authentication required)"""
    try:
        listing = db.query(Listing).filter(
            Listing.id == property_id,
            Listing.is_draft == False,
            Listing.status == "active"
        ).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Property not found")
        
        listing.views_count += 1
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
            "created_at": listing.created_at.isoformat() if listing.created_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting property detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ GET PROPERTY OWNER AND CREATE CONVERSATION ============
@router.get("/property-owner/{property_id}")
async def get_property_owner(
    property_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get property owner info and create/get conversation for messaging"""
    try:
        auth_header = request.headers.get('Authorization')
        logger.info(f"Auth header present: {auth_header is not None}")
        
        if not auth_header or not auth_header.startswith("Bearer "):
            logger.error("No Bearer token found")
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        token = auth_header.split(" ")[1]
        logger.info(f"Token received, length: {len(token)}")
        
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            email = payload.get("sub")
            logger.info(f"Decoded email: {email}")
            
            if not email:
                raise HTTPException(status_code=401, detail="Invalid token")
            
            current_user = db.query(User).filter(User.email == email).first()
            if not current_user:
                logger.error(f"User not found: {email}")
                raise HTTPException(status_code=401, detail="User not found")
                
        except jwt.ExpiredSignatureError:
            logger.error("Token expired")
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError as e:
            logger.error(f"Invalid token: {e}")
            raise HTTPException(status_code=401, detail="Invalid token")
        
        logger.info(f"Current user: {current_user.id} - {current_user.email}")
        
        # Get the property
        property_obj = db.query(Listing).filter(Listing.id == property_id).first()
        if not property_obj:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Get the owner (seller)
        owner = db.query(User).filter(User.id == property_obj.user_id).first()
        if not owner:
            raise HTTPException(status_code=404, detail="Owner not found")
        
        # Don't allow contacting yourself
        if owner.id == current_user.id:
            return {
                "success": False,
                "error": "You cannot message yourself"
            }
        
        # Determine buyer and seller
        buyer_id = current_user.id
        seller_id = owner.id
        
        # Get or create conversation between buyer and seller
        conversation = db.query(Conversation).filter(
            or_(
                and_(Conversation.buyer_id == buyer_id, Conversation.seller_id == seller_id),
                and_(Conversation.buyer_id == seller_id, Conversation.seller_id == buyer_id)
            )
        ).first()
        
        if not conversation:
            conversation = Conversation(
                buyer_id=buyer_id,
                seller_id=seller_id,
                property_id=property_id,
                last_message_time=datetime.utcnow()
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
            logger.info(f"Created new conversation: {conversation.id}")
        
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
        logger.error(f"Error getting property owner: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ============ CONTACT OWNER (Send initial message) ============
@router.post("/contact-owner")
async def contact_owner(
    data: dict,
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
        
        property_id = data.get("property_id")
        message_content = data.get("message", "")
        
        if not property_id:
            raise HTTPException(status_code=400, detail="Property ID required")
        
        property_obj = db.query(Listing).filter(Listing.id == property_id).first()
        if not property_obj:
            raise HTTPException(status_code=404, detail="Property not found")
        
        owner_id = property_obj.user_id
        
        if owner_id == current_user.id:
            raise HTTPException(status_code=400, detail="You cannot message yourself")
        
        # Create message
        new_message = Message(
            sender_id=current_user.id,
            receiver_id=owner_id,
            content=message_content or f"I'm interested in your property: {property_obj.title}",
            created_at=datetime.utcnow()
        )
        db.add(new_message)
        db.commit()
        db.refresh(new_message)
        
        # Get or create conversation
        conversation = db.query(Conversation).filter(
            or_(
                and_(Conversation.buyer_id == current_user.id, Conversation.seller_id == owner_id),
                and_(Conversation.buyer_id == owner_id, Conversation.seller_id == current_user.id)
            )
        ).first()
        
        if not conversation:
            conversation = Conversation(
                buyer_id=current_user.id,
                seller_id=owner_id,
                property_id=property_id,
                last_message_time=datetime.utcnow()
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
        
        # Update conversation
        conversation.last_message = new_message.content[:100]
        conversation.last_message_time = datetime.utcnow()
        conversation.last_message_sender_id = current_user.id
        
        if conversation.buyer_id == owner_id:
            conversation.buyer_unread += 1
        else:
            conversation.seller_unread += 1
        db.commit()
        
        return {
            "success": True,
            "message": "Message sent successfully",
            "conversation_id": conversation.id,
            "owner_id": owner_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error contacting owner: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ GET SAVED PROPERTIES ============
@router.get("/saved-properties")
async def get_saved_properties(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all saved properties for the current buyer"""
    try:
        saved = db.query(SavedProperty).filter(
            SavedProperty.user_id == current_user.id
        ).order_by(SavedProperty.saved_at.desc()).all()
        
        properties = []
        for item in saved:
            listing = db.query(Listing).filter(
                Listing.id == item.property_id,
                Listing.is_draft == False,
                Listing.status == "active"
            ).first()
            
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
                    "saved_at": item.saved_at.isoformat() if item.saved_at else None,
                    "created_at": listing.created_at.isoformat() if listing.created_at else None
                })
        
        return {
            "success": True,
            "saved": properties,
            "count": len(properties)
        }
        
    except Exception as e:
        logger.error(f"Error getting saved properties: {e}")
        return {"success": False, "saved": [], "count": 0, "error": str(e)}


# ============ SAVE PROPERTY ============
@router.post("/save-property/{property_id}")
async def save_property(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save a property to user's saved list"""
    try:
        # Check if property exists
        listing = db.query(Listing).filter(Listing.id == property_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Check if already saved
        existing = db.query(SavedProperty).filter(
            SavedProperty.user_id == current_user.id,
            SavedProperty.property_id == property_id
        ).first()
        
        if existing:
            return {
                "success": True,
                "saved": True,
                "message": "Property already saved"
            }
        
        # Save property
        new_saved = SavedProperty(
            user_id=current_user.id,
            property_id=property_id,
            saved_at=datetime.utcnow()
        )
        db.add(new_saved)
        db.commit()
        
        return {
            "success": True,
            "saved": True,
            "message": "Property saved successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving property: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ UNSAVE PROPERTY ============
@router.delete("/unsave-property/{property_id}")
async def unsave_property(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a property from user's saved list"""
    try:
        saved = db.query(SavedProperty).filter(
            SavedProperty.user_id == current_user.id,
            SavedProperty.property_id == property_id
        ).first()
        
        if not saved:
            return {
                "success": True,
                "saved": False,
                "message": "Property was not saved"
            }
        
        db.delete(saved)
        db.commit()
        
        return {
            "success": True,
            "saved": False,
            "message": "Property removed from saved"
        }
        
    except Exception as e:
        logger.error(f"Error unsaving property: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ SYNC SAVED PROPERTIES ============
@router.post("/sync-saved-properties")
async def sync_saved_properties(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sync saved properties (replace all saved for user)"""
    try:
        property_ids = data.get("property_ids", [])
        
        # Delete all existing saved properties for this user
        db.query(SavedProperty).filter(
            SavedProperty.user_id == current_user.id
        ).delete()
        
        # Add new saved properties
        for prop_id in property_ids:
            # Verify property exists
            listing = db.query(Listing).filter(Listing.id == prop_id).first()
            if listing:
                new_saved = SavedProperty(
                    user_id=current_user.id,
                    property_id=prop_id,
                    saved_at=datetime.utcnow()
                )
                db.add(new_saved)
        
        db.commit()
        return {"success": True, "message": f"Synced {len(property_ids)} saved properties"}
        
    except Exception as e:
        logger.error(f"Error syncing saved properties: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ CHECK IF PROPERTY IS SAVED ============
@router.get("/is-saved/{property_id}")
async def is_property_saved(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if a property is saved by the current user"""
    try:
        saved = db.query(SavedProperty).filter(
            SavedProperty.user_id == current_user.id,
            SavedProperty.property_id == property_id
        ).first()
        
        return {
            "success": True,
            "saved": saved is not None
        }
        
    except Exception as e:
        logger.error(f"Error checking saved status: {e}")
        return {"success": False, "saved": False, "error": str(e)}