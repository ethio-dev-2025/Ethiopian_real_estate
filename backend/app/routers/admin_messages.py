from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import List, Optional
from datetime import datetime
import json
from ..database import get_db
from ..models import User, Message as MessageModel, Conversation
from .auth import get_current_user, get_current_admin_user
from pydantic import BaseModel

router = APIRouter()

class SendMessageRequest(BaseModel):
    user_id: int
    message: str
    subject: Optional[str] = None

class MarkReadRequest(BaseModel):
    message_id: int

# WebSocket connection manager for real-time chat
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, websocket: WebSocket, user_id: int, user_role: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append({
            "websocket": websocket,
            "role": user_role
        })

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id] = [
                conn for conn in self.active_connections[user_id] 
                if conn["websocket"] != websocket
            ]
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_message(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection["websocket"].send_json(message)

manager = ConnectionManager()

# ============ REST API ENDPOINTS ============

@router.get("/conversations")
async def get_admin_conversations(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all conversations for admin"""
    try:
        # Get all conversations where admin is involved or get all users
        conversations = db.query(User).filter(
            User.role_type != "admin",
            User.is_active == True
        ).all()
        
        result = []
        for user in conversations:
            # Get last message from this user
            last_message = db.query(MessageModel).filter(
                or_(
                    MessageModel.sender_id == user.id,
                    MessageModel.receiver_id == user.id
                )
            ).order_by(desc(MessageModel.created_at)).first()
            
            # Get unread count
            unread_count = db.query(MessageModel).filter(
                MessageModel.sender_id == user.id,
                MessageModel.receiver_id == current_user.id,
                MessageModel.is_read == False
            ).count()
            
            result.append({
                "id": user.id,
                "name": user.full_name or user.username,
                "email": user.email,
                "phone": user.phone,
                "avatar": user.full_name[0] if user.full_name else user.username[0],
                "role": user.role_type,
                "last_message": last_message.content if last_message else "No messages yet",
                "last_message_time": last_message.created_at.isoformat() if last_message else None,
                "unread_count": unread_count,
                "is_online": True  # You can implement online status tracking
            })
        
        return result
    except Exception as e:
        print(f"Error getting conversations: {e}")
        return []

@router.get("/messages/{user_id}")
async def get_messages_with_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all messages between admin and specific user"""
    try:
        messages = db.query(MessageModel).filter(
            or_(
                and_(MessageModel.sender_id == current_user.id, MessageModel.receiver_id == user_id),
                and_(MessageModel.sender_id == user_id, MessageModel.receiver_id == current_user.id)
            )
        ).order_by(MessageModel.created_at.asc()).all()
        
        # Mark messages as read
        db.query(MessageModel).filter(
            MessageModel.sender_id == user_id,
            MessageModel.receiver_id == current_user.id,
            MessageModel.is_read == False
        ).update({"is_read": True})
        db.commit()
        
        result = []
        for msg in messages:
            sender = db.query(User).filter(User.id == msg.sender_id).first()
            result.append({
                "id": msg.id,
                "sender_id": msg.sender_id,
                "sender_name": sender.full_name if sender else "User",
                "receiver_id": msg.receiver_id,
                "message": msg.content,
                "subject": msg.subject,
                "is_read": msg.is_read,
                "is_mine": msg.sender_id == current_user.id,
                "created_at": msg.created_at.isoformat(),
                "time": msg.created_at.strftime("%I:%M %p") if msg.created_at else ""
            })
        
        return result
    except Exception as e:
        print(f"Error getting messages: {e}")
        return []

@router.post("/send")
async def send_message_to_user(
    request: SendMessageRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Send a message from admin to user"""
    try:
        # Check if user exists
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create message
        new_message = MessageModel(
            sender_id=current_user.id,
            receiver_id=request.user_id,
            content=request.message,
            subject=request.subject or "Admin Message",
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.add(new_message)
        db.commit()
        
        # Send WebSocket notification
        await manager.send_message(request.user_id, {
            "type": "new_message",
            "message": {
                "id": new_message.id,
                "sender_id": current_user.id,
                "sender_name": current_user.full_name or "Admin",
                "message": request.message,
                "time": datetime.now().strftime("%I:%M %p"),
                "is_mine": False
            }
        })
        
        return {
            "success": True,
            "message": "Message sent successfully",
            "message_id": new_message.id
        }
    except Exception as e:
        print(f"Error sending message: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mark-read")
async def mark_messages_read(
    request: MarkReadRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Mark a message as read"""
    try:
        db.query(MessageModel).filter(
            MessageModel.id == request.message_id,
            MessageModel.receiver_id == current_user.id
        ).update({"is_read": True})
        db.commit()
        
        return {"success": True}
    except Exception as e:
        print(f"Error marking read: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete/{message_id}")
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a message"""
    try:
        message = db.query(MessageModel).filter(MessageModel.id == message_id).first()
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        if message.sender_id != current_user.id and message.receiver_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        db.delete(message)
        db.commit()
        
        return {"success": True}
    except Exception as e:
        print(f"Error deleting message: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============ WEBSOCKET ENDPOINT ============
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """WebSocket connection for real-time chat"""
    # Get user from database to check role
    from ..database import SessionLocal
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            await websocket.close()
            return
        
        await manager.connect(websocket, user_id, user.role_type)
        
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "message":
                # Handle new message
                receiver_id = message_data.get("receiver_id")
                content = message_data.get("content")
                
                new_message = MessageModel(
                    sender_id=user_id,
                    receiver_id=receiver_id,
                    content=content,
                    is_read=False,
                    created_at=datetime.utcnow()
                )
                db.add(new_message)
                db.commit()
                
                # Send to receiver
                await manager.send_message(receiver_id, {
                    "type": "new_message",
                    "message": {
                        "id": new_message.id,
                        "sender_id": user_id,
                        "sender_name": user.full_name or user.username,
                        "message": content,
                        "time": datetime.now().strftime("%I:%M %p"),
                        "is_mine": False
                    }
                })
                
                # Send confirmation to sender
                await websocket.send_json({
                    "type": "message_sent",
                    "message": {
                        "id": new_message.id,
                        "content": content,
                        "time": datetime.now().strftime("%I:%M %p")
                    }
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    finally:
        db.close()