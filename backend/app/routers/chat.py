from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from ..database import get_db
from ..models import User, Listing, Conversation, Message
from .auth import get_current_user

router = APIRouter()

class ContactOwnerRequest(BaseModel):
    property_id: int
    message: str

class SendMessageRequest(BaseModel):
    conversation_id: int
    message: str

@router.post("/contact-owner")
async def contact_owner(
    request: ContactOwnerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Contact property owner - creates conversation and sends first message"""
    try:
        # Get property
        property = db.query(Listing).filter(Listing.id == request.property_id).first()
        if not property:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Check if conversation already exists
        existing_conv = db.query(Conversation).filter(
            Conversation.property_id == request.property_id,
            Conversation.buyer_id == current_user.id
        ).first()
        
        if existing_conv:
            # Add message to existing conversation
            new_message = Message(
                conversation_id=existing_conv.id,
                sender_id=current_user.id,
                receiver_id=property.user_id,
                content=request.message
            )
            db.add(new_message)
            
            existing_conv.last_message = request.message[:100]
            existing_conv.last_message_time = datetime.utcnow()
            existing_conv.updated_at = datetime.utcnow()
            existing_conv.seller_unread = (existing_conv.seller_unread or 0) + 1
            
            db.commit()
            
            return {
                "success": True,
                "conversation_id": existing_conv.id,
                "message": "Message sent successfully"
            }
        
        # Create new conversation
        new_conversation = Conversation(
            property_id=request.property_id,
            buyer_id=current_user.id,
            seller_id=property.user_id,
            last_message=request.message[:100],
            last_message_time=datetime.utcnow(),
            seller_unread=1,
            buyer_unread=0
        )
        db.add(new_conversation)
        db.commit()
        db.refresh(new_conversation)
        
        # Add first message
        new_message = Message(
            conversation_id=new_conversation.id,
            sender_id=current_user.id,
            receiver_id=property.user_id,
            content=request.message
        )
        db.add(new_message)
        db.commit()
        
        return {
            "success": True,
            "conversation_id": new_conversation.id,
            "message": "Owner contacted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error contacting owner: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations")
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all conversations for current user"""
    try:
        conversations = db.query(Conversation).filter(
            or_(
                Conversation.buyer_id == current_user.id,
                Conversation.seller_id == current_user.id
            )
        ).order_by(desc(Conversation.updated_at)).all()
        
        result = []
        for conv in conversations:
            property = db.query(Listing).filter(Listing.id == conv.property_id).first()
            
            is_buyer = conv.buyer_id == current_user.id
            other_user_id = conv.seller_id if is_buyer else conv.buyer_id
            other_user = db.query(User).filter(User.id == other_user_id).first()
            
            unread_count = conv.buyer_unread if is_buyer else conv.seller_unread
            
            # Get last message
            last_msg = db.query(Message).filter(
                Message.conversation_id == conv.id
            ).order_by(desc(Message.created_at)).first()
            
            result.append({
                "id": conv.id,
                "property_id": conv.property_id,
                "property_title": property.title if property else "Property",
                "other_user_id": other_user_id,
                "other_user_name": other_user.full_name if other_user else "User",
                "other_user_phone": other_user.phone if other_user else "",
                "last_message": last_msg.content[:100] if last_msg else "No messages",
                "last_message_time": last_msg.created_at.isoformat() if last_msg else None,
                "unread_count": unread_count or 0,
                "is_buyer": is_buyer
            })
        
        return result
    except Exception as e:
        print(f"Error: {e}")
        return []

@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all messages in a conversation"""
    try:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if conv.buyer_id != current_user.id and conv.seller_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Mark messages as read
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
            result.append({
                "id": msg.id,
                "sender_id": msg.sender_id,
                "receiver_id": msg.receiver_id,
                "message": msg.content,
                "is_mine": msg.sender_id == current_user.id,
                "is_read": msg.is_read,
                "created_at": msg.created_at.isoformat(),
                "time": msg.created_at.strftime("%I:%M %p") if msg.created_at else ""
            })
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/messages/send")
async def send_message(
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message in a conversation"""
    try:
        conv = db.query(Conversation).filter(Conversation.id == request.conversation_id).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if conv.buyer_id != current_user.id and conv.seller_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        receiver_id = conv.seller_id if conv.buyer_id == current_user.id else conv.buyer_id
        
        new_message = Message(
            conversation_id=request.conversation_id,
            sender_id=current_user.id,
            receiver_id=receiver_id,
            content=request.message
        )
        db.add(new_message)
        
        conv.last_message = request.message[:100]
        conv.last_message_time = datetime.utcnow()
        conv.updated_at = datetime.utcnow()
        
        # Update unread count for receiver
        if conv.buyer_id == receiver_id:
            conv.buyer_unread = (conv.buyer_unread or 0) + 1
        else:
            conv.seller_unread = (conv.seller_unread or 0) + 1
        
        db.commit()
        
        return {
            "success": True,
            "message": "Message sent",
            "message_id": new_message.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get total unread messages count"""
    try:
        conversations = db.query(Conversation).filter(
            or_(
                Conversation.buyer_id == current_user.id,
                Conversation.seller_id == current_user.id
            )
        ).all()
        
        total = 0
        for conv in conversations:
            if conv.buyer_id == current_user.id:
                total += conv.buyer_unread or 0
            else:
                total += conv.seller_unread or 0
        
        return {"unread_count": total}
    except Exception as e:
        print(f"Error: {e}")
        return {"unread_count": 0}