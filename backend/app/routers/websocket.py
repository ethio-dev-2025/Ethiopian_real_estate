# backend/app/routers/websocket.py
from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import json
from typing import Dict
from ..database import SessionLocal
from ..models import User
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
            except Exception:
                self.disconnect(user_id)
        return False


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
    """WebSocket endpoint - Simplified version"""
    db = None
    user = None
    
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
        
        print(f"✅ User authenticated: {user.email}")
        
        # Register connection
        await manager.connect(user.id, websocket)
        
        # Send confirmation
        await websocket.send_json({
            "type": "connection_established",
            "user_id": user.id,
            "message": "Connected"
        })
        
        # Keep connection alive
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                if message.get("type") == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": datetime.now().isoformat()})
                    
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                continue
                
    except WebSocketDisconnect:
        print(f"WebSocket disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if user:
            manager.disconnect(user.id)
        if db:
            db.close()


print("✅ WebSocket router loaded (simplified version)")