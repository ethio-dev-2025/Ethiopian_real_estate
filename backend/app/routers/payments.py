from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from ..database import get_db
from ..models import User
from .auth import get_current_user
from ..services.chapa_service import chapa_service
import json

router = APIRouter()

class PaymentInitRequest(BaseModel):
    plan_type: str
    amount: float
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = "0911111111"

class PaymentVerifyRequest(BaseModel):
    tx_ref: str

# ============ NEW: GET PAYMENT/SUBSCRIPTION STATUS ============
@router.get("/status")
async def get_payment_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's subscription status"""
    try:
        # Check subscription status based on seller_paid and landlord_paid
        has_subscription = False
        subscription_plan = "free"
        
        # Check if user has paid for any role
        if current_user.seller_paid or current_user.landlord_paid:
            has_subscription = True
            if current_user.seller_paid and current_user.landlord_paid:
                subscription_plan = "dual"
            elif current_user.seller_paid:
                subscription_plan = "seller"
            elif current_user.landlord_paid:
                subscription_plan = "landlord"
        
        # Also check for the new subscription fields (if they exist)
        if hasattr(current_user, 'has_active_subscription') and current_user.has_active_subscription:
            has_subscription = True
            subscription_plan = getattr(current_user, 'subscription_plan', 'premium')
        
        # Special case for test users
        if current_user.email in ["reduss@gmail.com", "dani@gmail.com", "test@example.com"]:
            has_subscription = True
            subscription_plan = "premium"
        
        return {
            "has_active_subscription": has_subscription,
            "subscription_plan": subscription_plan,
            "subscription_end_date": None,
            "can_create_listing": has_subscription
        }
        
    except Exception as e:
        print(f"Error in payment status: {e}")
        return {
            "has_active_subscription": False,
            "subscription_plan": "free",
            "subscription_end_date": None,
            "can_create_listing": False
        }

@router.post("/initialize")
async def initialize_payment(
    data: PaymentInitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Initialize Chapa payment for subscription"""
    
    print(f"Payment for user: {current_user.email}")
    print(f"Plan: {data.plan_type}, Amount: ${data.amount}")
    
    result = await chapa_service.initialize_payment(
        amount=data.amount,
        email=data.email,
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        plan_type=data.plan_type,
        user_id=current_user.id
    )
    
    if result["success"]:
        return {
            "success": True,
            "checkout_url": result["checkout_url"],
            "tx_ref": result["tx_ref"]
        }
    else:
        raise HTTPException(status_code=400, detail=result.get("error", "Payment failed"))

@router.post("/verify")
async def verify_payment(
    data: PaymentVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify payment status"""
    
    result = await chapa_service.verify_payment(data.tx_ref)
    
    if result.get("verified"):
        return {"success": True, "message": "Payment verified"}
    else:
        return {"success": False, "message": "Verification failed"}

@router.post("/webhook")
async def chapa_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Chapa webhook for payment confirmation"""
    
    try:
        body = await request.json()
        print(f"Webhook received: {body}")
        
        tx_ref = body.get("tx_ref")
        status = body.get("status")
        
        if status == "success" and tx_ref:
            # Parse tx_ref to get plan_type and user_id
            # Format: "seller-34-1734567890-abc"
            parts = tx_ref.split("-")
            plan_type = parts[0] if len(parts) > 0 else None
            user_id = parts[1] if len(parts) > 1 else None
            
            print(f"Processing payment: plan_type={plan_type}, user_id={user_id}")
            
            if user_id and plan_type:
                user = db.query(User).filter(User.id == int(user_id)).first()
                if user:
                    print(f"Found user: {user.email}")
                    
                    if plan_type == "seller":
                        user.seller_paid = True
                        user.seller_enabled = True
                        user.seller_approved = True
                        print(f"✅ Activated seller account for {user.email}")
                        
                    elif plan_type == "landlord":
                        user.landlord_paid = True
                        user.landlord_enabled = True
                        user.landlord_approved = True
                        print(f"✅ Activated landlord account for {user.email}")
                        
                    elif plan_type == "dual":
                        user.seller_paid = True
                        user.landlord_paid = True
                        user.seller_enabled = True
                        user.landlord_enabled = True
                        print(f"✅ Activated dual account for {user.email}")
                    
                    db.commit()
                else:
                    print(f"User not found with ID: {user_id}")
        
        return {"status": "received"}
        
    except Exception as e:
        print(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}