# backend/app/routers/messages.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
from datetime import datetime
import os
import uuid
import shutil
from ..database import get_db
from ..models import User, Message, Conversation, MessageStatus
from .auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

UPLOAD_DIR = "uploads/messages"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class MessageCreate(BaseModel):
    receiver_id: int
    content: str


# =========================================================
# GET OR CREATE CONVERSATION
# =========================================================
def get_or_create_conversation(db: Session, user1_id: int, user2_id: int):
    """Get or create a conversation between two users"""
    conversation = db.query(Conversation).filter(
        ((Conversation.buyer_id == user1_id) & (Conversation.seller_id == user2_id)) |
        ((Conversation.buyer_id == user2_id) & (Conversation.seller_id == user1_id))
    ).first()
    
    if not conversation:
        # Determine buyer and seller based on roles
        user1 = db.query(User).filter(User.id == user1_id).first()
        user2 = db.query(User).filter(User.id == user2_id).first()
        
        if user1.role_type == 'buyer':
            buyer_id = user1_id
            seller_id = user2_id
        elif user2.role_type == 'buyer':
            buyer_id = user2_id
            seller_id = user1_id
        else:
            # Both are non-buyers (admin, seller, landlord)
            buyer_id = min(user1_id, user2_id)
            seller_id = max(user1_id, user2_id)
        
        conversation = Conversation(
            buyer_id=buyer_id,
            seller_id=seller_id,
            buyer_unread=0,
            seller_unread=0,
            last_message_time=datetime.utcnow()
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    
    return conversation


# =========================================================
# SEND TEXT MESSAGE
# =========================================================
@router.post("/send")
async def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        receiver = db.query(User).filter(User.id == message_data.receiver_id).first()
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver not found")
        
        print(f"📝 Sending message from {current_user.id} to {message_data.receiver_id}")
        
        # Get or create conversation
        conversation = get_or_create_conversation(db, current_user.id, message_data.receiver_id)
        
        # Determine who is buyer and seller for unread count
        is_sender_buyer = (conversation.buyer_id == current_user.id)
        
        # Create message
        new_message = Message(
            sender_id=current_user.id,
            receiver_id=message_data.receiver_id,
            conversation_id=conversation.id,
            content=message_data.content,
            status=MessageStatus.SENT,
            is_read=False,
            created_at=datetime.utcnow()
        )
        
        db.add(new_message)
        
        # Update conversation
        conversation.last_message = message_data.content[:100]
        conversation.last_message_time = datetime.utcnow()
        conversation.updated_at = datetime.utcnow()
        
        # Update unread count for receiver
        if conversation.buyer_id == message_data.receiver_id:
            conversation.buyer_unread = (conversation.buyer_unread or 0) + 1
        else:
            conversation.seller_unread = (conversation.seller_unread or 0) + 1
        
        db.commit()
        db.refresh(new_message)
        
        sender_name = current_user.full_name or current_user.username
        
        message_response = {
            "id": new_message.id,
            "sender_id": new_message.sender_id,
            "receiver_id": new_message.receiver_id,
            "content": new_message.content,
            "attachment_url": new_message.attachment_url,
            "attachment_name": new_message.attachment_name,
            "attachment_type": new_message.attachment_type,
            "status": new_message.status.value,
            "is_read": new_message.is_read,
            "created_at": new_message.created_at.isoformat(),
            "sender_name": sender_name,
            "conversation_id": conversation.id,
            "unread_count": conversation.buyer_unread if conversation.buyer_id == message_data.receiver_id else conversation.seller_unread
        }
        
        # Send WebSocket notification
        try:
            from .websocket import manager
            # Notify receiver
            await manager.send_personal_message({
                "type": "new_message",
                "message": message_response
            }, message_data.receiver_id)
            
            # Notify sender
            await manager.send_personal_message({
                "type": "message_sent",
                "message": message_response
            }, current_user.id)
            
            # Also send unread count update to sidebar
            total_unread = db.query(Message).filter(
                Message.receiver_id == current_user.id,
                Message.is_read == False
            ).count()
            
            await manager.send_personal_message({
                "type": "unread_update",
                "count": total_unread
            }, current_user.id)
            
        except Exception as ws_error:
            print(f"⚠️ WebSocket notification failed: {ws_error}")
        
        return {
            "success": True,
            "message": message_response
        }
        
    except Exception as e:
        print(f"❌ Error sending message: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# =========================================================
# SEND MESSAGE WITH FILE ATTACHMENT
# =========================================================
@router.post("/send-with-attachment")
async def send_message_with_attachment(
    receiver_id: int = Form(...),
    content: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        receiver = db.query(User).filter(User.id == receiver_id).first()
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver not found")
        
        # Upload file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        user_id = current_user.id
        unique_id = str(uuid.uuid4())[:8]
        original_filename = file.filename.replace(" ", "_")
        safe_filename = f"{timestamp}_{user_id}_{unique_id}_{original_filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        content_type = file.content_type or ""
        if content_type.startswith("image/"):
            attachment_type = "image"
        elif content_type == "application/pdf":
            attachment_type = "pdf"
        elif content_type.startswith("video/"):
            attachment_type = "video"
        else:
            attachment_type = "file"
        
        file_url = f"/uploads/messages/{safe_filename}"
        
        # Get or create conversation
        conversation = get_or_create_conversation(db, current_user.id, receiver_id)
        
        # Create message
        new_message = Message(
            sender_id=current_user.id,
            receiver_id=receiver_id,
            conversation_id=conversation.id,
            content=content or "Sent a file",
            attachment_url=file_url,
            attachment_name=file.filename,
            attachment_type=attachment_type,
            status=MessageStatus.SENT,
            is_read=False,
            created_at=datetime.utcnow()
        )
        
        db.add(new_message)
        
        # Update conversation
        conversation.last_message = content[:100] if content else "Sent a file"
        conversation.last_message_time = datetime.utcnow()
        conversation.updated_at = datetime.utcnow()
        
        # Update unread count for receiver
        if conversation.buyer_id == receiver_id:
            conversation.buyer_unread = (conversation.buyer_unread or 0) + 1
        else:
            conversation.seller_unread = (conversation.seller_unread or 0) + 1
        
        db.commit()
        db.refresh(new_message)
        
        sender_name = current_user.full_name or current_user.username
        
        message_response = {
            "id": new_message.id,
            "sender_id": new_message.sender_id,
            "receiver_id": new_message.receiver_id,
            "content": new_message.content,
            "attachment_url": new_message.attachment_url,
            "attachment_name": new_message.attachment_name,
            "attachment_type": new_message.attachment_type,
            "status": new_message.status.value,
            "is_read": new_message.is_read,
            "created_at": new_message.created_at.isoformat(),
            "sender_name": sender_name,
            "conversation_id": conversation.id
        }
        
        # Send WebSocket notification
        try:
            from .websocket import manager
            await manager.send_personal_message({
                "type": "new_message",
                "message": message_response
            }, receiver_id)
            
            await manager.send_personal_message({
                "type": "message_sent",
                "message": message_response
            }, current_user.id)
            
        except Exception as ws_error:
            print(f"⚠️ WebSocket notification failed: {ws_error}")
        
        return {
            "success": True,
            "message": message_response
        }
        
    except Exception as e:
        print(f"❌ Error sending message: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# =========================================================
# GET CONVERSATIONS WITH UNREAD COUNTS
# =========================================================
@router.get("/conversations")
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        conversations = db.query(Conversation).filter(
            (Conversation.buyer_id == current_user.id) | (Conversation.seller_id == current_user.id)
        ).order_by(Conversation.updated_at.desc()).all()
        
        result = []
        for conv in conversations:
            other_user_id = conv.seller_id if conv.buyer_id == current_user.id else conv.buyer_id
            other_user = db.query(User).filter(User.id == other_user_id).first()
            
            if other_user:
                # Get unread count for current user
                unread_count = conv.buyer_unread if conv.buyer_id == current_user.id else conv.seller_unread
                
                result.append({
                    "id": conv.id,
                    "user_id": other_user.id,
                    "user_name": other_user.full_name or other_user.username,
                    "user_avatar": getattr(other_user, 'avatar_url', None),
                    "user_role": other_user.role_type,
                    "last_message": conv.last_message,
                    "last_message_at": conv.last_message_time.isoformat() if conv.last_message_time else None,
                    "unread_count": unread_count or 0
                })
        
        return result
        
    except Exception as e:
        print(f"Error getting conversations: {e}")
        return []


# =========================================================
# GET MESSAGES BETWEEN USERS
# =========================================================
@router.get("/messages/{user_id}")
async def get_messages(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 100
):
    try:
        # Get conversation
        conversation = db.query(Conversation).filter(
            ((Conversation.buyer_id == current_user.id) & (Conversation.seller_id == user_id)) |
            ((Conversation.buyer_id == user_id) & (Conversation.seller_id == current_user.id))
        ).first()
        
        # Mark messages as read if user opened conversation
        if conversation:
            # Update unread count for current user
            if conversation.buyer_id == current_user.id:
                conversation.buyer_unread = 0
            else:
                conversation.seller_unread = 0
            
            # Mark individual messages as read
            db.query(Message).filter(
                Message.conversation_id == conversation.id,
                Message.receiver_id == current_user.id,
                Message.is_read == False
            ).update({"is_read": True, "read_at": datetime.utcnow(), "status": MessageStatus.READ})
            
            db.commit()
        
        # Get messages
        messages = db.query(Message).filter(
            ((Message.sender_id == current_user.id) & (Message.receiver_id == user_id)) |
            ((Message.sender_id == user_id) & (Message.receiver_id == current_user.id))
        ).order_by(Message.created_at.asc()).limit(limit).all()
        
        result = []
        for msg in messages:
            result.append({
                "id": msg.id,
                "sender_id": msg.sender_id,
                "receiver_id": msg.receiver_id,
                "content": msg.content,
                "attachment_url": msg.attachment_url,
                "attachment_name": msg.attachment_name,
                "attachment_type": msg.attachment_type,
                "status": msg.status.value,
                "is_read": msg.is_read,
                "created_at": msg.created_at.isoformat()
            })
        
        return result
        
    except Exception as e:
        print(f"Error getting messages: {e}")
        return []


# =========================================================
# GET UNREAD COUNT
# =========================================================
@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Get total unread count from conversations
        conversations = db.query(Conversation).filter(
            (Conversation.buyer_id == current_user.id) | (Conversation.seller_id == current_user.id)
        ).all()
        
        total = 0
        for conv in conversations:
            if conv.buyer_id == current_user.id:
                total += conv.buyer_unread or 0
            else:
                total += conv.seller_unread or 0
        
        return {"count": total, "unread_count": total}
    except Exception as e:
        print(f"Error getting unread count: {e}")
        return {"count": 0, "unread_count": 0}


# =========================================================
# MARK ALL MESSAGES AS READ
# =========================================================
@router.post("/mark-all-read/{user_id}")
async def mark_all_messages_read(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all messages from a specific user as read"""
    try:
        # Get conversation
        conversation = db.query(Conversation).filter(
            ((Conversation.buyer_id == current_user.id) & (Conversation.seller_id == user_id)) |
            ((Conversation.buyer_id == user_id) & (Conversation.seller_id == current_user.id))
        ).first()
        
        updated_count = 0
        
        if conversation:
            # Update unread count
            if conversation.buyer_id == current_user.id:
                updated_count = conversation.buyer_unread or 0
                conversation.buyer_unread = 0
            else:
                updated_count = conversation.seller_unread or 0
                conversation.seller_unread = 0
            
            # Mark individual messages as read
            db.query(Message).filter(
                Message.conversation_id == conversation.id,
                Message.receiver_id == current_user.id,
                Message.is_read == False
            ).update({"is_read": True, "read_at": datetime.utcnow(), "status": MessageStatus.READ})
            
            db.commit()
        
        # Get total unread count for sidebar
        total_unread = db.query(Message).filter(
            Message.receiver_id == current_user.id,
            Message.is_read == False
        ).count()
        
        return {"success": True, "read_count": updated_count, "total_unread": total_unread}
        
    except Exception as e:
        print(f"Error marking messages as read: {e}")
        return {"success": False, "read_count": 0}


# =========================================================
# UPLOAD FILE
# =========================================================
@router.post("/upload")
async def upload_message_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    try:
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max 10MB")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        user_id = current_user.id
        unique_id = str(uuid.uuid4())[:8]
        original_filename = file.filename.replace(" ", "_")
        safe_filename = f"{timestamp}_{user_id}_{unique_id}_{original_filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_url = f"/uploads/messages/{safe_filename}"
        
        return {
            "success": True,
            "url": file_url,
            "original_name": file.filename
        }
        
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


print("✅ Messages router loaded with unread tracking!")