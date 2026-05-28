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
from ..models.payment import PaymentTransaction
from .auth import get_current_user, get_current_admin_user

router = APIRouter()

# Chapa Configuration - YOUR SECRET KEY
CHAPA_SECRET_KEY = os.getenv("CHAPA_SECRET_KEY", "CHASECK_TEST-fbdEa9IuLsnknOdqwiU8qSUtiNNKrips")
CHAPA_BASE_URL = "https://api.chapa.co/v1"
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

print("=" * 60)
print("✅ REAL CHAPA PAYMENT ROUTER LOADED")
print(f"🔑 Using Secret Key: {CHAPA_SECRET_KEY[:20]}...")
print("=" * 60)


class PaymentInitRequest(BaseModel):
    plan_type: str
    amount: float
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = "0911111111"


@router.post("/initialize")
async def initialize_payment(
    data: PaymentInitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Initialize REAL Chapa payment - Redirects to Chapa Checkout"""
    
    try:
        print("=" * 50)
        print(f"💰 REAL CHAPA PAYMENT")
        print(f"👤 User: {current_user.email}")
        print(f"📦 Plan: {data.plan_type}, Amount: ETB {data.amount}")
        print("=" * 50)
        
        # Generate unique transaction reference
        tx_ref = f"{data.plan_type}-{current_user.id}-{uuid.uuid4().hex[:8]}"
        
        # Create payment record
        payment = PaymentTransaction(
            user_id=current_user.id,
            tx_ref=tx_ref,
            plan_type=data.plan_type,
            amount=data.amount,
            currency="ETB",
            payment_status="initiated",
            status="pending"
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)
        
        print(f"💾 Payment record created: ID={payment.id}")
        
        # Short title for Chapa (max 16 chars)
        title_map = {
            "seller": "Seller Plan",
            "landlord": "Landlord Plan", 
            "dual": "Dual Plan"
        }
        
        # Prepare Chapa request
        chapa_data = {
            "amount": str(data.amount),
            "currency": "ETB",
            "email": data.email,
            "first_name": data.first_name,
            "last_name": data.last_name,
            "tx_ref": tx_ref,
            "callback_url": f"{FRONTEND_URL}/payment/callback",
            "return_url": f"{FRONTEND_URL}/dashboard/seller?payment=success",
            "customization": {
                "title": title_map.get(data.plan_type, "Plan")[:16],
                "description": f"{data.plan_type} subscription"
            }
        }
        
        # Add phone if provided
        if data.phone and len(data.phone) >= 10:
            chapa_data["phone_number"] = data.phone
        
        print(f"🚀 Sending to Chapa API...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{CHAPA_BASE_URL}/transaction/initialize",
                json=chapa_data,
                headers={
                    "Authorization": f"Bearer {CHAPA_SECRET_KEY}",
                    "Content-Type": "application/json"
                }
            )
            
            print(f"📡 Chapa Response Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"📦 Chapa Response: {json.dumps(result, indent=2)}")
                
                if result.get("status") == "success":
                    checkout_url = result.get("data", {}).get("checkout_url")
                    print(f"✅ REDIRECTING TO REAL CHAPA: {checkout_url}")
                    
                    return {
                        "success": True,
                        "checkout_url": checkout_url,
                        "tx_ref": tx_ref
                    }
                else:
                    error_msg = result.get("message", "Chapa initialization failed")
                    print(f"❌ Chapa Error: {error_msg}")
                    return {"success": False, "message": error_msg}
            else:
                error_text = response.text
                print(f"❌ HTTP {response.status_code}: {error_text}")
                return {"success": False, "message": f"HTTP {response.status_code}"}
                
    except httpx.TimeoutException:
        print("❌ Timeout - Chapa API slow")
        return {"success": False, "message": "Connection timeout. Please try again."}
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "message": str(e)}


@router.post("/webhook")
async def chapa_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Chapa webhook - Called when payment is successful"""
    try:
        body = await request.json()
        print(f"📨 WEBHOOK RECEIVED: {json.dumps(body, indent=2)}")
        
        tx_ref = body.get("tx_ref")
        status = body.get("status")
        transaction_id = body.get("transaction_id", "")
        
        if status == "success" and tx_ref:
            payment = db.query(PaymentTransaction).filter(
                PaymentTransaction.tx_ref == tx_ref
            ).first()
            
            if payment:
                payment.payment_status = "completed"
                payment.transaction_id = transaction_id
                db.commit()
                print(f"✅ Payment completed for {tx_ref}")
            else:
                print(f"⚠️ Payment not found for {tx_ref}")
        
        return {"status": "received"}
        
    except Exception as e:
        print(f"❌ Webhook error: {e}")
        return {"status": "error"}


@router.get("/status")
async def get_payment_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's payment status"""
    try:
        payment = db.query(PaymentTransaction).filter(
            PaymentTransaction.user_id == current_user.id
        ).order_by(PaymentTransaction.created_at.desc()).first()
        
        return {
            "success": True,
            "has_active_subscription": current_user.payment_approved == True,
            "payment_approved": current_user.payment_approved,
            "payment_status": payment.status if payment else "none"
        }
    except Exception as e:
        return {"success": False, "has_active_subscription": False}


# ============ ADMIN ENDPOINTS ============
@router.get("/admin/payments")
async def get_admin_payments(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    status: Optional[str] = "pending"
):
    """Get payments for admin approval"""
    try:
        query = db.query(PaymentTransaction)
        if status and status != "all":
            query = query.filter(PaymentTransaction.status == status)
        
        payments = query.order_by(PaymentTransaction.created_at.desc()).all()
        
        result = []
        for payment in payments:
            user = db.query(User).filter(User.id == payment.user_id).first()
            result.append({
                "id": payment.id,
                "user_id": payment.user_id,
                "user_name": user.full_name or user.username if user else "Unknown",
                "user_email": user.email if user else "Unknown",
                "phone_number": user.phone if user else "",
                "plan_type": payment.plan_type,
                "amount": payment.amount,
                "status": payment.status,
                "transaction_id": payment.transaction_id or f"TXN-{payment.id}",
                "created_at": payment.created_at.isoformat() if payment.created_at else None,
                "rejection_reason": payment.rejection_reason
            })
        
        return result
    except Exception as e:
        print(f"Error: {e}")
        return []


@router.post("/admin/approve-payment/{payment_id}")
async def approve_payment(
    payment_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Admin approves payment and activates user"""
    try:
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_id).first()
        if not payment:
            return {"success": False, "message": "Payment not found"}
        
        if payment.status != "pending":
            return {"success": False, "message": f"Payment already {payment.status}"}
        
        user = db.query(User).filter(User.id == payment.user_id).first()
        if not user:
            return {"success": False, "message": "User not found"}
        
        # Update payment
        payment.status = "approved"
        payment.reviewed_by = current_user.id
        payment.reviewed_at = datetime.utcnow()
        
        # Activate user
        user.payment_approved = True
        user.can_create_listings = True
        user.is_activated = True
        user.status = "active"
        user.has_active_subscription = True
        
        if payment.plan_type == "seller" or payment.plan_type == "dual":
            user.seller_enabled = True
            user.seller_paid = True
        if payment.plan_type == "landlord" or payment.plan_type == "dual":
            user.landlord_enabled = True
            user.landlord_paid = True
        if payment.plan_type == "dual":
            user.role_type = "dual"
        elif payment.plan_type == "seller":
            user.role_type = "seller"
        elif payment.plan_type == "landlord":
            user.role_type = "landlord"
        
        db.commit()
        
        print(f"✅ Payment {payment_id} approved for {user.email}")
        
        return {"success": True, "message": "Payment approved and account activated"}
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        return {"success": False, "message": str(e)}


@router.post("/admin/reject-payment/{payment_id}")
async def reject_payment(
    payment_id: int,
    rejection_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Admin rejects payment"""
    try:
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_id).first()
        if not payment:
            return {"success": False, "message": "Payment not found"}
        
        reason = rejection_data.get("reason", "No reason provided")
        
        payment.status = "rejected"
        payment.rejection_reason = reason
        payment.reviewed_by = current_user.id
        payment.reviewed_at = datetime.utcnow()
        
        db.commit()
        
        return {"success": True, "message": "Payment rejected"}
    except Exception as e:
        print(f"Error: {e}")
        return {"success": False, "message": str(e)}


print("✅ REAL CHAPA Router Ready!")