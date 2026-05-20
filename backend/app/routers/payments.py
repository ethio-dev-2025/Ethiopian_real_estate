# backend/app/routers/payments.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
import httpx
import uuid
import os
import json
from ..database import get_db
from ..models import User
from .auth import get_current_user

router = APIRouter()

# Chapa Configuration
CHAPA_SECRET_KEY = os.getenv("CHAPA_SECRET_KEY", "CHASECK_TEST-pYUkz07fDi9ek06PubdOuuKe3c9Ahjod")
CHAPA_BASE_URL = "https://api.chapa.co/v1"

class PaymentInitRequest(BaseModel):
    plan_type: str
    amount: float
    email: EmailStr  # This ensures valid email format
    first_name: str
    last_name: str
    phone: Optional[str] = "0911111111"

class PaymentVerifyRequest(BaseModel):
    tx_ref: str

@router.get("/status")
async def get_payment_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's subscription status"""
    try:
        has_subscription = False
        subscription_plan = "free"
        
        if current_user.seller_paid or current_user.landlord_paid:
            has_subscription = True
            if current_user.seller_paid and current_user.landlord_paid:
                subscription_plan = "dual"
            elif current_user.seller_paid:
                subscription_plan = "seller"
            elif current_user.landlord_paid:
                subscription_plan = "landlord"
        
        return {
            "has_active_subscription": has_subscription,
            "subscription_plan": subscription_plan,
            "can_create_listing": has_subscription
        }
        
    except Exception as e:
        print(f"Error in payment status: {e}")
        return {
            "has_active_subscription": False,
            "subscription_plan": "free",
            "can_create_listing": False
        }

@router.post("/initialize")
async def initialize_payment(
    data: PaymentInitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Initialize Chapa payment for subscription"""
    
    try:
        print(f"💰 Payment for user: {current_user.email}")
        print(f"📦 Plan: {data.plan_type}, Amount: ETB {data.amount}")
        print(f"📧 Email: {data.email}")
        
        # Generate unique transaction reference
        tx_ref = f"{data.plan_type}-{current_user.id}-{uuid.uuid4().hex[:8]}"
        
        # Prepare Chapa request data - FIXED FORMAT
        chapa_data = {
            "amount": str(data.amount),  # Convert to string
            "currency": "ETB",
            "email": data.email,
            "first_name": data.first_name,
            "last_name": data.last_name,
            "tx_ref": tx_ref,
            "callback_url": "https://cc6vnmzb-8000.uks1.devtunnels.ms/api/payment/webhook",
            # "return_url": f"http://localhost:5173/settings",
            "customization": {
                "title": f"{data.plan_type.upper()} Plan",
                "description": f"Subscribe to {data.plan_type} plan"
            }
        }
        
        print(f"🚀 Chapa request: {json.dumps(chapa_data, indent=2)}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{CHAPA_BASE_URL}/transaction/initialize",
                json=chapa_data,
                headers={
                    "Authorization": f"Bearer {CHAPA_SECRET_KEY}",
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
            
            print(f"📡 Response status: {response.status_code}")
            result = response.json()
            print(f"📦 Chapa response: {json.dumps(result, indent=2)}")
            
            if response.status_code == 200 and result.get("status") == "success":
                checkout_url = result.get("data", {}).get("checkout_url")
                return {
                    "success": True,
                    "checkout_url": checkout_url,
                    "tx_ref": tx_ref
                }
            else:
                error_msg = result.get("message", "Payment initialization failed")
                if isinstance(error_msg, dict):
                    error_msg = json.dumps(error_msg)
                return {
                    "success": False,
                    "message": error_msg
                }
                
    except Exception as e:
        print(f"❌ Payment error: {e}")
        return {"success": False, "message": str(e)}

@router.get("/webhook")
async def chapa_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Chapa webhook for payment confirmation"""
    print("444444444444444444444444444444444444444")
    print(request.json())  
    print("4444444444444444444444444444444444444444")
    try:
        body = await request.json()
        print(f"📨 Webhook received: {body}")
        
        tx_ref = body.get("tx_ref")
        status = body.get("status")
        
        if status == "success" and tx_ref:
            parts = tx_ref.split("-")
            plan_type = parts[0] if len(parts) > 0 else None
            user_id = parts[1] if len(parts) > 1 else None
            
            if user_id and plan_type:
                user = db.query(User).filter(User.id == int(user_id)).first()
                if user:
                    print(f"✅ Found user: {user.email}")
                    
                    if plan_type == "seller":
                        user.seller_paid = True
                        user.seller_enabled = True
                        user.seller_approved = True
                        user.role_type = "seller"
                    elif plan_type == "landlord":
                        user.landlord_paid = True
                        user.landlord_enabled = True
                        user.landlord_approved = True
                        user.role_type = "landlord"
                    elif plan_type == "dual":
                        user.seller_paid = True
                        user.landlord_paid = True
                        user.seller_enabled = True
                        user.landlord_enabled = True
                        user.seller_approved = True
                        user.landlord_approved = True
                        user.role_type = "dual"
                    
                    user.has_active_subscription = True
                    db.commit()
                    print(f"✅ Subscription activated for {user.email}")
        
        return {"status": "received"}
        
    except Exception as e:
        print(f"❌ Webhook error: {e}")
        return {"status": "error", "message": str(e)}