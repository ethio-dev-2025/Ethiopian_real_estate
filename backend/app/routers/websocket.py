from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from sqlalchemy.orm import Session
from datetime import datetime
import json
from typing import Dict
from ..database import SessionLocal
from ..models import User, Message, Conversation, MessageStatus
from ..config import settings
import jwt

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}
        self.user_status: Dict[int, str] = {}
    
    async def connect(self, user_id: int, websocket: WebSocket):
        self.active_connections[user_id] = websocket
        self.user_status[user_id] = "online"
        print(f"✅ User {user_id} connected. Active connections: {list(self.active_connections.keys())}")
        await self.broadcast_user_status(user_id, "online")
    
    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        self.user_status[user_id] = "offline"
        print(f"❌ User {user_id} disconnected. Active connections: {list(self.active_connections.keys())}")
    
    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            try:
                websocket = self.active_connections[user_id]
                await websocket.send_json(message)
                print(f"✅ Message sent to user {user_id}: {message.get('type')}")
                return True
            except Exception as e:
                print(f"❌ Error sending to user {user_id}: {e}")
                if user_id in self.active_connections:
                    del self.active_connections[user_id]
                return False
        else:
            print(f"⚠️ User {user_id} not connected")
            return False
    
    async def broadcast_user_status(self, user_id: int, status: str):
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
                except:
                    pass
    
    async def broadcast_typing(self, sender_id: int, receiver_id: int, is_typing: bool):
        typing_message = {
            "type": "typing",
            "sender_id": sender_id,
            "is_typing": is_typing,
            "timestamp": datetime.now().isoformat()
        }
        await self.send_personal_message(typing_message, receiver_id)
    
    def is_user_online(self, user_id: int) -> bool:
        return user_id in self.active_connections

manager = ConnectionManager()

def verify_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        return email
    except Exception as e:
        print(f"Token verification error: {e}")
        return None

@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    db = None
    user = None
    
    try:
        print("🔌 WebSocket connection attempt")
        await websocket.accept()
        print("✅ WebSocket connection accepted")
        
        email = verify_token(token)
        if not email:
            print("❌ Invalid token, closing connection")
            await websocket.close(code=1008, reason="Invalid token")
            return
        
        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"❌ User not found for email: {email}")
            await websocket.close(code=1008, reason="User not found")
            return
        
        print(f"✅ User authenticated: ID={user.id}, Email={user.email}, Role={user.role_type}")
        
        await manager.connect(user.id, websocket)
        
        await websocket.send_json({
            "type": "connection_established",
            "user_id": user.id,
            "message": "WebSocket connected successfully"
        })
        
        try:
            while True:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                msg_type = message_data.get("type")
                
                print(f"📨 Received [{msg_type}] from user {user.id}")
                
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
                    
                    print(f"📝 Saving message from {user.id} to {receiver_id}: '{content}'")
                    
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
                    
                    if conversation.buyer_id == receiver_id:
                        conversation.buyer_unread += 1
                    else:
                        conversation.seller_unread += 1
                    db.commit()
                    print(f"📊 Updated conversation {conversation.id}, unread count updated")
                    
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
                    
                    # Send to receiver if online (REAL-TIME UPDATE FOR REDUSS)
                    receiver_online = manager.is_user_online(receiver_id)
                    print(f"📡 Receiver {receiver_id} (reduss) online: {receiver_online}")
                    
                    if receiver_online:
                        await manager.send_personal_message({
                            "type": "new_message",
                            "message": message_response
                        }, receiver_id)
                        # Update status to delivered
                        new_message.status = MessageStatus.DELIVERED
                        db.commit()
                        message_response["status"] = "delivered"
                        print(f"📤 Message sent to receiver {receiver_id}")
                    else:
                        print(f"⚠️ Receiver {receiver_id} not online")
                    
                    # Send confirmation to sender (REAL-TIME UPDATE FOR SHEGAW)
                    await websocket.send_json({
                        "type": "message_sent",
                        "message": message_response
                    })
                    print(f"✅ Confirmation sent to sender {user.id}")
                
                elif msg_type == "read_receipt":
                    sender_id = message_data.get("sender_id")
                    if sender_id:
                        updated_count = db.query(Message).filter(
                            Message.sender_id == sender_id,
                            Message.receiver_id == user.id,
                            Message.is_read == False
                        ).update({"is_read": True, "read_at": datetime.utcnow(), "status": MessageStatus.READ})
                        
                        db.commit()
                        
                        if updated_count > 0:
                            print(f"📖 Marked {updated_count} messages as read from user {sender_id}")
                            await manager.send_personal_message({
                                "type": "messages_read",
                                "receiver_id": user.id,
                                "sender_id": sender_id,
                                "read_count": updated_count
                            }, sender_id)
                
                elif msg_type == "typing":
                    receiver_id = message_data.get("receiver_id")
                    is_typing = message_data.get("is_typing", True)
                    if receiver_id:
                        await manager.broadcast_typing(user.id, receiver_id, is_typing)
                
                elif msg_type == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    })
                    
        except WebSocketDisconnect:
            print(f"🔌 User {user.id} disconnected")
            manager.disconnect(user.id)
            if user:
                await manager.broadcast_user_status(user.id, "offline")
            
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        import traceback
        traceback.print_exc()
        if user:
            manager.disconnect(user.id)
    finally:
        if db:
            db.close()
            print(f"Database session closed")