# backend/app/routers/websocket.py
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
        """Broadcast unread count to user"""
        try:
            # Get total unread count
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
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except Exception as e:
        print(f"Token verification error: {e}")
        return None


@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """WebSocket endpoint for real-time chat"""
    db = None
    user = None
    user_id = None
    
    try:
        # Accept connection
        await websocket.accept()
        print("🔌 WebSocket connection accepted")
        
        # Verify token
        email = verify_token(token)
        if not email:
            print("❌ Invalid token")
            await websocket.close(code=1008)
            return
        
        # Get user
        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"❌ User not found")
            await websocket.close(code=1008)
            return
        
        user_id = user.id
        print(f"✅ User authenticated: {user_id} - {user.email}")
        
        # Register connection
        await manager.connect(user_id, websocket)
        
        # Send confirmation and initial unread count
        await websocket.send_json({
            "type": "connection_established",
            "user_id": user_id,
            "message": "Connected"
        })
        
        # Send initial unread count
        await manager.broadcast_unread_count(user_id, db)
        
        # Keep connection alive and handle messages
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                msg_type = message.get("type")
                
                if msg_type == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": datetime.now().isoformat()})
                
                elif msg_type == "read_receipt":
                    sender_id = message.get("sender_id")
                    if sender_id and db:
                        # Mark messages as read
                        db.query(Message).filter(
                            Message.sender_id == sender_id,
                            Message.receiver_id == user_id,
                            Message.is_read == False
                        ).update({"is_read": True, "status": "read"})
                        db.commit()
                        
                        # Update conversation unread
                        conversation = db.query(Conversation).filter(
                            ((Conversation.buyer_id == user_id) & (Conversation.seller_id == sender_id)) |
                            ((Conversation.buyer_id == sender_id) & (Conversation.seller_id == user_id))
                        ).first()
                        
                        if conversation:
                            if conversation.buyer_id == user_id:
                                conversation.buyer_unread = 0
                            else:
                                conversation.seller_unread = 0
                            db.commit()
                        
                        # Send read receipt
                        await manager.send_personal_message({
                            "type": "messages_read",
                            "reader_id": user_id,
                            "sender_id": sender_id,
                            "read_at": datetime.utcnow().isoformat()
                        }, sender_id)
                        
                        # Update unread count for user
                        await manager.broadcast_unread_count(user_id, db)
                
                elif msg_type == "typing":
                    receiver_id = message.get("receiver_id")
                    is_typing = message.get("is_typing", False)
                    if receiver_id:
                        await manager.send_personal_message({
                            "type": "typing",
                            "sender_id": user_id,
                            "is_typing": is_typing
                        }, receiver_id)
                
                elif msg_type == "mark_read":
                    other_user_id = message.get("other_user_id")
                    if other_user_id and db:
                        # Mark conversation as read
                        conversation = db.query(Conversation).filter(
                            ((Conversation.buyer_id == user_id) & (Conversation.seller_id == other_user_id)) |
                            ((Conversation.buyer_id == other_user_id) & (Conversation.seller_id == user_id))
                        ).first()
                        
                        if conversation:
                            if conversation.buyer_id == user_id:
                                conversation.buyer_unread = 0
                            else:
                                conversation.seller_unread = 0
                            db.commit()
                            
                            # Notify other user
                            await manager.send_personal_message({
                                "type": "conversation_read",
                                "user_id": user_id,
                                "other_user_id": other_user_id
                            }, other_user_id)
                            
                            # Update unread count
                            await manager.broadcast_unread_count(user_id, db)
                
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
            manager.disconnect(user_id)
        if db:
            db.close()
        print(f"Cleaned up connection for user {user_id}")


print("✅ WebSocket router loaded with unread tracking!")