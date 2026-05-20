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

class MessageWithAttachmentCreate(BaseModel):
    receiver_id: int
    content: str

def get_or_create_conversation(db: Session, user1_id: int, user2_id: int, property_id: int = None):
    conversation = db.query(Conversation).filter(
        or_(
            and_(Conversation.buyer_id == user1_id, Conversation.seller_id == user2_id),
            and_(Conversation.buyer_id == user2_id, Conversation.seller_id == user1_id)
        )
    ).first()
    
    if not conversation:
        conversation = Conversation(
            buyer_id=min(user1_id, user2_id),
            seller_id=max(user1_id, user2_id),
            property_id=property_id,
            last_message_time=datetime.utcnow()
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    
    return conversation

def update_conversation_last_message(db: Session, conversation_id: int, message: Message):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation:
        conversation.last_message = message.content[:100] if message.content else "Sent a file"
        conversation.last_message_time = message.created_at
        conversation.last_message_sender_id = message.sender_id
        
        if conversation.buyer_id == message.receiver_id:
            conversation.buyer_unread += 1
        else:
            conversation.seller_unread += 1
        
        db.commit()

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
        
        new_message = Message(
            sender_id=current_user.id,
            receiver_id=message_data.receiver_id,
            content=message_data.content,
            status=MessageStatus.SENT,
            created_at=datetime.utcnow()
        )
        
        db.add(new_message)
        db.commit()
        db.refresh(new_message)
        
        conversation = get_or_create_conversation(db, current_user.id, message_data.receiver_id)
        update_conversation_last_message(db, conversation.id, new_message)
        
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
            "sender_name": sender_name
        }
        
        try:
            from .websocket import manager
            sent = await manager.send_personal_message({
                "type": "new_message",
                "message": message_response
            }, message_data.receiver_id)
            
            await manager.send_personal_message({
                "type": "message_sent",
                "message": message_response
            }, current_user.id)
            
            if sent:
                new_message.status = MessageStatus.DELIVERED
                db.commit()
                message_response["status"] = "delivered"
        except Exception as ws_error:
            print(f"❌ WebSocket notification failed: {ws_error}")
        
        return {
            "success": True,
            "message": message_response
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error sending message: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# =========================================================
# UPLOAD FILE (for chat)
# =========================================================
@router.post("/upload")
async def upload_message_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
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
        
        content_type = file.content_type or ""
        if content_type.startswith("image/"):
            file_type = "image"
        elif content_type == "application/pdf":
            file_type = "pdf"
        elif content_type.startswith("video/"):
            file_type = "video"
        else:
            file_type = "file"
        
        file_url = f"/uploads/messages/{safe_filename}"
        
        return {
            "url": file_url,
            "success": True,
            "filename": safe_filename,
            "original_name": file.filename,
            "file_type": file_type,
            "size": file_size
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


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
        
        new_message = Message(
            sender_id=current_user.id,
            receiver_id=receiver_id,
            content=content,
            attachment_url=file_url,
            attachment_name=file.filename,
            attachment_type=attachment_type,
            status=MessageStatus.SENT,
            created_at=datetime.utcnow()
        )
        
        db.add(new_message)
        db.commit()
        db.refresh(new_message)
        
        conversation = get_or_create_conversation(db, current_user.id, receiver_id)
        update_conversation_last_message(db, conversation.id, new_message)
        
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
            "sender_name": sender_name
        }
        
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
            
            new_message.status = MessageStatus.DELIVERED
            db.commit()
            message_response["status"] = "delivered"
            
        except Exception as ws_error:
            print(f"❌ WebSocket notification failed: {ws_error}")
        
        return {
            "success": True,
            "message": message_response
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error sending message with attachment: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# =========================================================
# GET CONVERSATIONS
# =========================================================
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
        ).order_by(Conversation.last_message_time.desc()).all()
        
        result = []
        for conv in conversations:
            other_user_id = conv.seller_id if conv.buyer_id == current_user.id else conv.buyer_id
            other_user = db.query(User).filter(User.id == other_user_id).first()
            
            if other_user:
                unread_count = conv.seller_unread if conv.buyer_id == current_user.id else conv.buyer_unread
                
                result.append({
                    "id": conv.id,
                    "user_id": other_user.id,
                    "user_name": other_user.full_name or other_user.username,
                    "user_avatar": getattr(other_user, 'avatar_url', None),
                    "user_role": other_user.role_type,
                    "last_message": conv.last_message,
                    "last_message_at": conv.last_message_time.isoformat() if conv.last_message_time else None,
                    "unread_count": unread_count,
                    "is_online": False
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
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Mark unread messages as read
        db.query(Message).filter(
            Message.sender_id == user_id,
            Message.receiver_id == current_user.id,
            Message.is_read == False
        ).update({"is_read": True, "read_at": datetime.utcnow(), "status": MessageStatus.READ})
        
        # Update conversation unread counts
        conversation = db.query(Conversation).filter(
            or_(
                and_(Conversation.buyer_id == current_user.id, Conversation.seller_id == user_id),
                and_(Conversation.buyer_id == user_id, Conversation.seller_id == current_user.id)
            )
        ).first()
        
        if conversation:
            if conversation.buyer_id == current_user.id:
                conversation.buyer_unread = 0
            else:
                conversation.seller_unread = 0
            db.commit()
        
        # Get messages
        messages = db.query(Message).filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
                and_(Message.sender_id == user_id, Message.receiver_id == current_user.id)
            )
        ).order_by(Message.created_at.desc()).offset(offset).limit(limit).all()
        
        result = []
        for msg in reversed(messages):
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
        count = db.query(Message).filter(
            Message.receiver_id == current_user.id,
            Message.is_read == False
        ).count()
        return {"count": count}
    except Exception as e:
        print(f"Error getting unread count: {e}")
        return {"count": 0}


# =========================================================
# MARK MESSAGE AS DELIVERED (for WebSocket)
# =========================================================
@router.post("/mark-delivered/{message_id}")
async def mark_message_delivered(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        message = db.query(Message).filter(Message.id == message_id).first()
        if message and message.receiver_id == current_user.id:
            message.status = MessageStatus.DELIVERED
            db.commit()
            
            try:
                from .websocket import manager
                await manager.send_personal_message({
                    "type": "message_delivered",
                    "message_id": message_id,
                    "sender_id": message.sender_id
                }, message.sender_id)
            except:
                pass
            
            return {"success": True}
        return {"success": False}
    except Exception as e:
        print(f"Error marking message delivered: {e}")
        return {"success": False}


# =========================================================
# MARK MESSAGE AS READ
# =========================================================
@router.post("/mark-read/{message_id}")
async def mark_message_read(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        message = db.query(Message).filter(Message.id == message_id).first()
        if message and message.receiver_id == current_user.id:
            message.is_read = True
            message.read_at = datetime.utcnow()
            message.status = MessageStatus.READ
            db.commit()
            
            try:
                from .websocket import manager
                await manager.send_personal_message({
                    "type": "messages_read",
                    "message_id": message_id,
                    "sender_id": message.sender_id
                }, message.sender_id)
            except:
                pass
            
            return {"success": True}
        return {"success": False}
    except Exception as e:
        print(f"Error marking message read: {e}")
        return {"success": False}


# =========================================================
# MARK ALL MESSAGES AS READ IN CONVERSATION
# =========================================================
@router.post("/mark-all-read/{user_id}")
async def mark_all_messages_read(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all messages from a specific user as read"""
    try:
        updated_count = db.query(Message).filter(
            Message.sender_id == user_id,
            Message.receiver_id == current_user.id,
            Message.is_read == False
        ).update({"is_read": True, "read_at": datetime.utcnow(), "status": MessageStatus.READ})
        
        # Update conversation unread count
        conversation = db.query(Conversation).filter(
            ((Conversation.buyer_id == current_user.id) & (Conversation.seller_id == user_id)) |
            ((Conversation.buyer_id == user_id) & (Conversation.seller_id == current_user.id))
        ).first()
        
        if conversation:
            if conversation.buyer_id == current_user.id:
                conversation.buyer_unread = 0
            else:
                conversation.seller_unread = 0
            db.commit()
        
        db.commit()
        
        # Notify sender via WebSocket
        try:
            from .websocket import manager
            await manager.send_personal_message({
                "type": "messages_read",
                "receiver_id": current_user.id,
                "sender_id": user_id,
                "read_count": updated_count
            }, user_id)
        except:
            pass
        
        return {"success": True, "read_count": updated_count}
        
    except Exception as e:
        print(f"Error marking messages as read: {e}")
        return {"success": False, "read_count": 0}