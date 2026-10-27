from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import json
from typing import Dict
from ..database import SessionLocal
from ..models import User, Message, Conversation
from ..config import settings
import jwt

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}
    
    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"✅ WebSocket connected: User {user_id}")
    
    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"❌ WebSocket disconnected: User {user_id}")
    
    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
                return True
            except Exception as e:
                print(f"Error sending to user {user_id}: {e}")
                self.disconnect(user_id)
        return False
    
    async def broadcast_unread_count(self, user_id: int, db: Session):
        try:
            conversations = db.query(Conversation).filter(
                (Conversation.buyer_id == user_id) | (Conversation.seller_id == user_id)
            ).all()
            
            total = 0
            for conv in conversations:
                if conv.buyer_id == user_id:
                    total += conv.buyer_unread or 0
                else:
                    total += conv.seller_unread or 0
            
            await self.send_personal_message({
                "type": "unread_update",
                "count": total
            }, user_id)
        except Exception as e:
            print(f"Error broadcasting unread count: {e}")


manager = ConnectionManager()


def verify_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except Exception as e:
        print(f"Token verification error: {e}")
        return None


@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    db = None
    user_id = None
    
    try:
        await websocket.accept()
        print("🔌 WebSocket connection accepted")
        
        email = verify_token(token)
        if not email:
            print("❌ Invalid token")
            await websocket.close(code=1008)
            return
        
        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"❌ User not found")
            await websocket.close(code=1008)
            return
        
        user_id = user.id
        print(f"✅ User authenticated: {user_id} - {user.email}")
        
        await manager.connect(user_id, websocket)
        
        await websocket.send_json({
            "type": "connection_established",
            "user_id": user_id,
            "message": "Connected"
        })
        
        await manager.broadcast_unread_count(user_id, db)
        
        # Broadcast online status
        for uid, ws in manager.active_connections.items():
            if uid != user_id:
                await manager.send_personal_message({
                    "type": "user_status",
                    "user_id": user_id,
                    "status": "online"
                }, uid)
        
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                msg_type = message.get("type")
                
                if msg_type == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": datetime.now().isoformat()})
                
                elif msg_type == "read_receipt":
                    sender_id = message.get("sender_id")
                    reader_id = message.get("reader_id", user_id)
                    
                    print(f"📖 READ RECEIPT: User {reader_id} read messages from {sender_id}")
                    
                    if sender_id and db:
                        # Get all unread messages from sender to reader
                        unread_messages = db.query(Message).filter(
                            Message.sender_id == sender_id,
                            Message.receiver_id == reader_id,
                            Message.is_read == False
                        ).all()
                        
                        print(f"   Found {len(unread_messages)} unread messages")
                        
                        # Mark all as read
                        for msg in unread_messages:
                            msg.is_read = True
                            msg.status = "read"
                            msg.read_at = datetime.utcnow()
                            print(f"   ✅ Marked message {msg.id} as READ")
                        
                        db.commit()
                        
                        # Update conversation unread count
                        conversation = db.query(Conversation).filter(
                            ((Conversation.buyer_id == reader_id) & (Conversation.seller_id == sender_id)) |
                            ((Conversation.buyer_id == sender_id) & (Conversation.seller_id == reader_id))
                        ).first()
                        
                        if conversation:
                            if conversation.buyer_id == reader_id:
                                conversation.buyer_unread = 0
                            else:
                                conversation.seller_unread = 0
                            db.commit()
                        
                        # Send read receipt to sender
                        await manager.send_personal_message({
                            "type": "messages_read",
                            "reader_id": reader_id,
                            "sender_id": sender_id,
                            "read_at": datetime.utcnow().isoformat()
                        }, sender_id)
                        
                        # Also update reader's own UI
                        await manager.send_personal_message({
                            "type": "messages_read",
                            "reader_id": reader_id,
                            "sender_id": sender_id,
                            "read_at": datetime.utcnow().isoformat()
                        }, reader_id)
                        
                        # Update unread counts
                        await manager.broadcast_unread_count(reader_id, db)
                        await manager.broadcast_unread_count(sender_id, db)
                        
                        print(f"   ✅ Sent read receipt to sender {sender_id}")
                
                elif msg_type == "message_delivered":
                    message_id = message.get("message_id")
                    sender_id = message.get("sender_id")
                    
                    if message_id and db:
                        db.query(Message).filter(Message.id == message_id).update({
                            "status": "delivered"
                        })
                        db.commit()
                        
                        await manager.send_personal_message({
                            "type": "message_delivered",
                            "message_id": message_id,
                            "status": "delivered"
                        }, sender_id)
                
                elif msg_type == "typing":
                    receiver_id = message.get("receiver_id")
                    is_typing = message.get("is_typing", False)
                    if receiver_id:
                        await manager.send_personal_message({
                            "type": "typing",
                            "sender_id": user_id,
                            "is_typing": is_typing
                        }, receiver_id)
                
            except WebSocketDisconnect:
                print(f"WebSocket disconnected for user {user_id}")
                break
            except json.JSONDecodeError:
                continue
            except Exception as e:
                print(f"Error processing message: {e}")
                continue
                
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for user {user_id if user_id else 'unknown'}")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if user_id:
            for uid, ws in manager.active_connections.items():
                if uid != user_id:
                    await manager.send_personal_message({
                        "type": "user_status",
                        "user_id": user_id,
                        "status": "offline"
                    }, uid)
            manager.disconnect(user_id)
        if db:
            db.close()
        print(f"Cleaned up connection for user {user_id}")


print("✅ WebSocket router loaded with REAL-TIME read receipts!")