# backend/app/routers/admin_messages.py
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_
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
        print(f"✅ Admin WebSocket connected: User {user_id}")

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id] = [
                conn for conn in self.active_connections[user_id] 
                if conn["websocket"] != websocket
            ]
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        print(f"❌ Admin WebSocket disconnected: User {user_id}")

    async def send_message(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection["websocket"].send_json(message)
                except:
                    pass

manager = ConnectionManager()


# ============ REST API ENDPOINTS ============

@router.get("/conversations")
async def get_admin_conversations(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all conversations for admin with unread counts"""
    try:
        # Get all non-admin users who have interacted with admin
        # First, find users who have sent messages to admin or received from admin
        user_ids = set()
        
        # Users who sent messages to admin
        sent_messages = db.query(MessageModel.sender_id).filter(
            MessageModel.receiver_id == current_user.id
        ).distinct().all()
        
        # Users who received messages from admin
        received_messages = db.query(MessageModel.receiver_id).filter(
            MessageModel.sender_id == current_user.id
        ).distinct().all()
        
        for msg in sent_messages:
            user_ids.add(msg.sender_id)
        for msg in received_messages:
            user_ids.add(msg.receiver_id)
        
        # Also include all sellers, landlords, dual users, buyers
        all_users = db.query(User).filter(
            User.role_type.in_(['seller', 'landlord', 'dual', 'buyer']),
            User.is_active == True,
            User.id != current_user.id
        ).all()
        
        for user in all_users:
            user_ids.add(user.id)
        
        result = []
        for user_id in user_ids:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                continue
            
            # Get last message between admin and this user
            last_message = db.query(MessageModel).filter(
                or_(
                    and_(MessageModel.sender_id == user.id, MessageModel.receiver_id == current_user.id),
                    and_(MessageModel.sender_id == current_user.id, MessageModel.receiver_id == user.id)
                )
            ).order_by(desc(MessageModel.created_at)).first()
            
            # Get unread count (messages from user to admin that are unread)
            unread_count = db.query(MessageModel).filter(
                MessageModel.sender_id == user.id,
                MessageModel.receiver_id == current_user.id,
                MessageModel.is_read == False
            ).count()
            
            # Get or create conversation ID
            conversation = db.query(Conversation).filter(
                ((Conversation.buyer_id == user.id) & (Conversation.seller_id == current_user.id)) |
                ((Conversation.buyer_id == current_user.id) & (Conversation.seller_id == user.id))
            ).first()
            
            result.append({
                "id": conversation.id if conversation else user.id,
                "user_id": user.id,
                "user_name": user.full_name or user.username,
                "user_role": user.role_type,
                "user_avatar": user.avatar_url,
                "email": user.email,
                "phone": user.phone,
                "last_message": last_message.content[:100] if last_message else "No messages yet",
                "last_message_at": last_message.created_at.isoformat() if last_message else None,
                "unread_count": unread_count,
                "is_online": False
            })
        
        # Sort by last_message_time descending
        result.sort(key=lambda x: x.get("last_message_at") or "", reverse=True)
        
        # Calculate total unread count for sidebar badge
        total_unread = sum(item["unread_count"] for item in result)
        
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
        # Verify user exists
        other_user = db.query(User).filter(User.id == user_id).first()
        if not other_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get messages
        messages = db.query(MessageModel).filter(
            or_(
                and_(MessageModel.sender_id == current_user.id, MessageModel.receiver_id == user_id),
                and_(MessageModel.sender_id == user_id, MessageModel.receiver_id == current_user.id)
            )
        ).order_by(MessageModel.created_at.asc()).all()
        
        # Mark messages as read
        updated_count = db.query(MessageModel).filter(
            MessageModel.sender_id == user_id,
            MessageModel.receiver_id == current_user.id,
            MessageModel.is_read == False
        ).update({"is_read": True, "read_at": datetime.utcnow()})
        db.commit()
        
        # Update conversation unread counts
        conversation = db.query(Conversation).filter(
            ((Conversation.buyer_id == user_id) & (Conversation.seller_id == current_user.id)) |
            ((Conversation.buyer_id == current_user.id) & (Conversation.seller_id == user_id))
        ).first()
        
        if conversation:
            if conversation.buyer_id == current_user.id:
                conversation.buyer_unread = 0
            else:
                conversation.seller_unread = 0
            db.commit()
        
        result = []
        for msg in messages:
            sender = db.query(User).filter(User.id == msg.sender_id).first()
            result.append({
                "id": msg.id,
                "sender_id": msg.sender_id,
                "sender_name": sender.full_name or sender.username if sender else "User",
                "receiver_id": msg.receiver_id,
                "content": msg.content,
                "subject": msg.subject,
                "is_read": msg.is_read,
                "is_mine": msg.sender_id == current_user.id,
                "created_at": msg.created_at.isoformat(),
                "time": msg.created_at.strftime("%I:%M %p") if msg.created_at else ""
            })
        
        # Broadcast updated unread count
        total_unread = db.query(MessageModel).filter(
            MessageModel.receiver_id == current_user.id,
            MessageModel.is_read == False
        ).count()
        
        await manager.send_message(current_user.id, {
            "type": "unread_update",
            "count": total_unread
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
        
        # Get or create conversation
        conversation = db.query(Conversation).filter(
            ((Conversation.buyer_id == user.id) & (Conversation.seller_id == current_user.id)) |
            ((Conversation.buyer_id == current_user.id) & (Conversation.seller_id == user.id))
        ).first()
        
        if not conversation:
            # Determine buyer and seller
            if user.role_type == 'buyer':
                buyer_id = user.id
                seller_id = current_user.id
            else:
                buyer_id = min(user.id, current_user.id)
                seller_id = max(user.id, current_user.id)
            
            conversation = Conversation(
                buyer_id=buyer_id,
                seller_id=seller_id,
                last_message_time=datetime.utcnow()
            )
            db.add(conversation)
            db.flush()
        
        # Create message
        new_message = MessageModel(
            sender_id=current_user.id,
            receiver_id=request.user_id,
            conversation_id=conversation.id,
            content=request.message,
            subject=request.subject or "Admin Message",
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.add(new_message)
        
        # Update conversation
        conversation.last_message = request.message[:100]
        conversation.last_message_time = datetime.utcnow()
        conversation.updated_at = datetime.utcnow()
        
        # Update unread count for receiver
        if conversation.buyer_id == request.user_id:
            conversation.buyer_unread = (conversation.buyer_unread or 0) + 1
        else:
            conversation.seller_unread = (conversation.seller_unread or 0) + 1
        
        db.commit()
        db.refresh(new_message)
        
        # Send WebSocket notification to receiver
        await manager.send_message(request.user_id, {
            "type": "new_message",
            "message": {
                "id": new_message.id,
                "sender_id": current_user.id,
                "sender_name": current_user.full_name or "Admin",
                "content": request.message,
                "created_at": datetime.utcnow().isoformat(),
                "is_mine": False
            }
        })
        
        # Send unread count update to receiver
        receiver_unread = db.query(MessageModel).filter(
            MessageModel.receiver_id == request.user_id,
            MessageModel.is_read == False
        ).count()
        
        await manager.send_message(request.user_id, {
            "type": "unread_update",
            "count": receiver_unread
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
        message = db.query(MessageModel).filter(
            MessageModel.id == request.message_id,
            MessageModel.receiver_id == current_user.id
        ).first()
        
        if message:
            message.is_read = True
            message.read_at = datetime.utcnow()
            db.commit()
            
            # Send read receipt to sender
            await manager.send_message(message.sender_id, {
                "type": "message_read",
                "message_id": message.id,
                "reader_id": current_user.id
            })
        
        return {"success": True}
        
    except Exception as e:
        print(f"Error marking read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unread-count")
async def get_admin_unread_count(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get total unread count for admin"""
    try:
        count = db.query(MessageModel).filter(
            MessageModel.receiver_id == current_user.id,
            MessageModel.is_read == False
        ).count()
        return {"count": count}
    except Exception as e:
        print(f"Error getting unread count: {e}")
        return {"count": 0}


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
@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """WebSocket connection for real-time chat"""
    from ..database import SessionLocal
    from ..config import settings
    import jwt
    
    db = SessionLocal()
    try:
        # Verify token
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            email = payload.get("sub")
            if not email:
                await websocket.close()
                return
        except:
            await websocket.close()
            return
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            await websocket.close()
            return
        
        await manager.connect(websocket, user.id, user.role_type)
        
        # Send initial unread count
        unread_count = db.query(MessageModel).filter(
            MessageModel.receiver_id == user.id,
            MessageModel.is_read == False
        ).count()
        await websocket.send_json({
            "type": "unread_update",
            "count": unread_count
        })
        
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "message":
                receiver_id = message_data.get("receiver_id")
                content = message_data.get("content")
                
                receiver = db.query(User).filter(User.id == receiver_id).first()
                if not receiver:
                    continue
                
                # Get or create conversation
                conversation = db.query(Conversation).filter(
                    ((Conversation.buyer_id == user.id) & (Conversation.seller_id == receiver_id)) |
                    ((Conversation.buyer_id == receiver_id) & (Conversation.seller_id == user.id))
                ).first()
                
                if not conversation:
                    if user.role_type == 'buyer':
                        buyer_id = user.id
                        seller_id = receiver_id
                    elif receiver.role_type == 'buyer':
                        buyer_id = receiver_id
                        seller_id = user.id
                    else:
                        buyer_id = min(user.id, receiver_id)
                        seller_id = max(user.id, receiver_id)
                    
                    conversation = Conversation(
                        buyer_id=buyer_id,
                        seller_id=seller_id,
                        last_message_time=datetime.utcnow()
                    )
                    db.add(conversation)
                    db.flush()
                
                # Create message
                new_message = MessageModel(
                    sender_id=user.id,
                    receiver_id=receiver_id,
                    conversation_id=conversation.id,
                    content=content,
                    is_read=False,
                    created_at=datetime.utcnow()
                )
                db.add(new_message)
                
                # Update conversation
                conversation.last_message = content[:100]
                conversation.last_message_time = datetime.utcnow()
                conversation.updated_at = datetime.utcnow()
                
                # Update unread count
                if conversation.buyer_id == receiver_id:
                    conversation.buyer_unread = (conversation.buyer_unread or 0) + 1
                else:
                    conversation.seller_unread = (conversation.seller_unread or 0) + 1
                
                db.commit()
                
                # Send to receiver
                await manager.send_message(receiver_id, {
                    "type": "new_message",
                    "message": {
                        "id": new_message.id,
                        "sender_id": user.id,
                        "sender_name": user.full_name or user.username,
                        "content": content,
                        "created_at": datetime.utcnow().isoformat(),
                        "is_mine": False
                    }
                })
                
                # Send unread count update to receiver
                receiver_unread = db.query(MessageModel).filter(
                    MessageModel.receiver_id == receiver_id,
                    MessageModel.is_read == False
                ).count()
                await manager.send_message(receiver_id, {
                    "type": "unread_update",
                    "count": receiver_unread
                })
                
                # Send confirmation to sender
                await websocket.send_json({
                    "type": "message_sent",
                    "message": {
                        "id": new_message.id,
                        "content": content,
                        "created_at": datetime.utcnow().isoformat()
                    }
                })
                
            elif message_data.get("type") == "mark_read":
                other_user_id = message_data.get("other_user_id")
                if other_user_id:
                    db.query(MessageModel).filter(
                        MessageModel.sender_id == other_user_id,
                        MessageModel.receiver_id == user.id,
                        MessageModel.is_read == False
                    ).update({"is_read": True, "read_at": datetime.utcnow()})
                    db.commit()
                    
                    # Update conversation unread
                    conversation = db.query(Conversation).filter(
                        ((Conversation.buyer_id == user.id) & (Conversation.seller_id == other_user_id)) |
                        ((Conversation.buyer_id == other_user_id) & (Conversation.seller_id == user.id))
                    ).first()
                    
                    if conversation:
                        if conversation.buyer_id == user.id:
                            conversation.buyer_unread = 0
                        else:
                            conversation.seller_unread = 0
                        db.commit()
                    
                    # Send read receipt
                    await manager.send_message(other_user_id, {
                        "type": "messages_read",
                        "reader_id": user.id,
                        "sender_id": other_user_id
                    })
                    
                    # Update own unread count
                    new_unread = db.query(MessageModel).filter(
                        MessageModel.receiver_id == user.id,
                        MessageModel.is_read == False
                    ).count()
                    await websocket.send_json({
                        "type": "unread_update",
                        "count": new_unread
                    })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user.id if user else None)
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        db.close()


print("✅ Admin messages router loaded with unread tracking!")