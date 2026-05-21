# backend/app/routers/websocket.py
from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import json
from typing import Dict
from ..database import SessionLocal, get_db
from ..models import User, Message, Conversation, MessageStatus
from ..config import settings
import jwt

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}
        self.user_status: Dict[int, str] = {}
    
    async def connect(self, user_id: int, websocket: WebSocket):
        """Accept WebSocket connection - ONLY ONE ACCEPT CALL"""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_status[user_id] = "online"
        print(f"✅ User {user_id} connected. Active: {list(self.active_connections.keys())}")
        await self.broadcast_user_status(user_id, "online")
    
    def disconnect(self, user_id: int):
        """Remove user from active connections"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        self.user_status[user_id] = "offline"
        print(f"❌ User {user_id} disconnected. Active: {list(self.active_connections.keys())}")
        # Don't broadcast here to avoid calling disconnect during cleanup
    
    async def broadcast_user_status(self, user_id: int, status: str):
        """Broadcast user status to all connected users"""
        status_message = {
            "type": "user_status",
            "user_id": user_id,
            "status": status,
            "timestamp": datetime.now().isoformat()
        }
        for conn_user_id, connection in self.active_connections.items():
            if conn_user_id != user_id:
                try:
                    await connection.send_json(status_message)
                except Exception:
                    pass
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Send message to specific user"""
        if user_id in self.active_connections:
            try:
                websocket = self.active_connections[user_id]
                await websocket.send_json(message)
                return True
            except Exception as e:
                print(f"Error sending to user {user_id}: {e}")
                self.disconnect(user_id)
                return False
        return False
    
    async def broadcast_typing(self, sender_id: int, receiver_id: int, is_typing: bool):
        """Send typing indicator"""
        typing_message = {
            "type": "typing",
            "sender_id": sender_id,
            "is_typing": is_typing,
            "timestamp": datetime.now().isoformat()
        }
        await self.send_personal_message(typing_message, receiver_id)
    
    def is_user_online(self, user_id: int) -> bool:
        """Check if user is online"""
        return user_id in self.active_connections

manager = ConnectionManager()


def verify_token(token: str):
    """Verify JWT token and return email"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        return email
    except Exception as e:
        print(f"Token verification error: {e}")
        return None


@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """WebSocket endpoint for real-time messaging"""
    db = None
    user = None
    
    try:
        print("🔌 WebSocket connection attempt")
        
        # Accept the connection FIRST (only once)
        await websocket.accept()
        print("✅ WebSocket connection accepted")
        
        # Then authenticate
        email = verify_token(token)
        if not email:
            print("❌ Invalid token, closing connection")
            await websocket.close(code=1008, reason="Invalid token")
            return
        
        # Create database session
        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"❌ User not found for email: {email}")
            await websocket.close(code=1008, reason="User not found")
            return
        
        print(f"✅ User authenticated: ID={user.id}, Email={user.email}")
        
        # Register user connection
        await manager.connect(user.id, websocket)
        
        # Send connection confirmation
        await websocket.send_json({
            "type": "connection_established",
            "user_id": user.id,
            "message": "WebSocket connected successfully"
        })
        
        # Send unread count
        unread_count = db.query(Message).filter(
            Message.receiver_id == user.id,
            Message.is_read == False
        ).count()
        await websocket.send_json({
            "type": "unread_count",
            "count": unread_count
        })
        
        # Main message loop
        while True:
            try:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                msg_type = message_data.get("type")
                
                print(f"📨 Received [{msg_type}] from user {user.id}")
                
                # Handle ping
                if msg_type == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    })
                    continue
                
                # Handle message sending
                if msg_type == "message":
                    receiver_id = message_data.get("receiver_id")
                    content = message_data.get("content", "")
                    attachment_url = message_data.get("attachment_url")
                    attachment_name = message_data.get("attachment_name")
                    attachment_type = message_data.get("attachment_type")
                    
                    if not receiver_id:
                        await websocket.send_json({"type": "error", "message": "receiver_id required"})
                        continue
                    
                    receiver = db.query(User).filter(User.id == receiver_id).first()
                    if not receiver:
                        await websocket.send_json({"type": "error", "message": "Receiver not found"})
                        continue
                    
                    print(f"📝 Saving message from {user.id} to {receiver_id}")
                    
                    # Create new message
                    new_message = Message(
                        sender_id=user.id,
                        receiver_id=receiver_id,
                        content=content,
                        attachment_url=attachment_url,
                        attachment_name=attachment_name,
                        attachment_type=attachment_type,
                        status=MessageStatus.SENT,
                        created_at=datetime.utcnow()
                    )
                    db.add(new_message)
                    db.commit()
                    db.refresh(new_message)
                    
                    # Get or create conversation
                    conversation = db.query(Conversation).filter(
                        ((Conversation.buyer_id == user.id) & (Conversation.seller_id == receiver_id)) |
                        ((Conversation.buyer_id == receiver_id) & (Conversation.seller_id == user.id))
                    ).first()
                    
                    if not conversation:
                        conversation = Conversation(
                            buyer_id=min(user.id, receiver_id),
                            seller_id=max(user.id, receiver_id),
                            last_message_time=datetime.utcnow()
                        )
                        db.add(conversation)
                        db.commit()
                        db.refresh(conversation)
                        print(f"💬 Created new conversation: {conversation.id}")
                    
                    # Update conversation
                    conversation.last_message = content[:100] if content else "Sent a file"
                    conversation.last_message_time = datetime.utcnow()
                    conversation.last_message_sender_id = user.id
                    
                    # Update unread count for receiver
                    if conversation.buyer_id == receiver_id:
                        conversation.buyer_unread = (conversation.buyer_unread or 0) + 1
                    else:
                        conversation.seller_unread = (conversation.seller_unread or 0) + 1
                    db.commit()
                    
                    # Prepare message response
                    message_response = {
                        "id": new_message.id,
                        "sender_id": new_message.sender_id,
                        "receiver_id": new_message.receiver_id,
                        "content": new_message.content,
                        "attachment_url": new_message.attachment_url,
                        "attachment_name": new_message.attachment_name,
                        "attachment_type": new_message.attachment_type,
                        "status": "sent",
                        "is_read": new_message.is_read,
                        "created_at": new_message.created_at.isoformat(),
                        "sender_name": user.full_name or user.username
                    }
                    
                    # Send to receiver if online
                    receiver_online = manager.is_user_online(receiver_id)
                    
                    conversation_data_for_receiver = {
                        "id": conversation.id,
                        "user_id": user.id,
                        "user_name": user.full_name or user.username,
                        "last_message": message_response["content"],
                        "last_message_at": message_response["created_at"],
                        "unread_count": conversation.buyer_unread if conversation.buyer_id == receiver_id else conversation.seller_unread
                    }
                    
                    if receiver_online:
                        await manager.send_personal_message({
                            "type": "new_message",
                            "message": message_response,
                            "conversation_update": conversation_data_for_receiver
                        }, receiver_id)
                        
                        # Mark as delivered
                        new_message.status = MessageStatus.DELIVERED
                        db.commit()
                        message_response["status"] = "delivered"
                        print(f"📤 Message sent to receiver {receiver_id}")
                    else:
                        print(f"⚠️ Receiver {receiver_id} not online")
                    
                    # Send confirmation to sender
                    await websocket.send_json({
                        "type": "message_sent",
                        "message": message_response
                    })
                    
                    # Send conversation update to sender
                    conversation_data_for_sender = {
                        "id": conversation.id,
                        "user_id": receiver_id,
                        "user_name": receiver.full_name or receiver.username,
                        "last_message": message_response["content"],
                        "last_message_at": message_response["created_at"],
                        "unread_count": 0
                    }
                    
                    await websocket.send_json({
                        "type": "conversation_update",
                        "conversation": conversation_data_for_sender
                    })
                
                # Handle read receipt
                elif msg_type == "read_receipt":
                    sender_id = message_data.get("sender_id")
                    if sender_id:
                        updated_count = db.query(Message).filter(
                            Message.sender_id == sender_id,
                            Message.receiver_id == user.id,
                            Message.is_read == False
                        ).update({"is_read": True, "read_at": datetime.utcnow(), "status": MessageStatus.READ})
                        
                        # Reset conversation unread count
                        conversation = db.query(Conversation).filter(
                            ((Conversation.buyer_id == user.id) & (Conversation.seller_id == sender_id)) |
                            ((Conversation.buyer_id == sender_id) & (Conversation.seller_id == user.id))
                        ).first()
                        
                        if conversation:
                            if conversation.buyer_id == user.id:
                                conversation.buyer_unread = 0
                            else:
                                conversation.seller_unread = 0
                            db.commit()
                        
                        if updated_count > 0:
                            print(f"📖 Marked {updated_count} messages as read from user {sender_id}")
                            
                            # Notify sender
                            await manager.send_personal_message({
                                "type": "messages_read",
                                "receiver_id": user.id,
                                "sender_id": sender_id,
                                "read_count": updated_count,
                                "conversation_id": conversation.id if conversation else None
                            }, sender_id)
                
                # Handle typing indicator
                elif msg_type == "typing":
                    receiver_id = message_data.get("receiver_id")
                    is_typing = message_data.get("is_typing", True)
                    if receiver_id:
                        await manager.broadcast_typing(user.id, receiver_id, is_typing)
                
                # Handle mark as read
                elif msg_type == "mark_read":
                    message_id = message_data.get("message_id")
                    if message_id:
                        message = db.query(Message).filter(Message.id == message_id).first()
                        if message and message.receiver_id == user.id:
                            message.is_read = True
                            message.read_at = datetime.utcnow()
                            db.commit()
                    
            except WebSocketDisconnect:
                print(f"🔌 User {user.id} disconnected")
                manager.disconnect(user.id)
                break
            except json.JSONDecodeError as e:
                print(f"Invalid JSON: {e}")
                continue
            except Exception as e:
                print(f"Error in message loop: {e}")
                continue
                
    except WebSocketDisconnect:
        if user:
            print(f"🔌 WebSocket disconnected for user {user.id}")
            manager.disconnect(user.id)
    except Exception as e:
        print(f"❌ WebSocket fatal error: {e}")
        import traceback
        traceback.print_exc()
        if user:
            manager.disconnect(user.id)
    finally:
        if db:
            db.close()