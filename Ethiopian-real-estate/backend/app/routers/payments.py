# backend/app/routers/payments.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
import secrets
from datetime import datetime, timedelta
from ..database import get_db
from ..models import User, PaymentTransaction, ActivationRequest
from .auth import get_current_user, get_current_admin_user
from pydantic import BaseModel
import httpx
import os
import warnings
from fastapi.responses import HTMLResponse

router = APIRouter()

warnings.filterwarnings("ignore")

CHAPA_SECRET_KEY = os.getenv("CHAPA_SECRET_KEY", "CHASECK_TEST-fbdEa9IuLsnknOdqwiU8qSUtiNNKrips")
CHAPA_BASE_URL = "https://api.chapa.co/v1"
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://ethiopian-real-estate.onrender.com")
BASE_URL = os.getenv("BASE_URL", "https://ethiopian-real-estate-api.onrender.com")

class InitializePaymentRequest(BaseModel):
    plan_type: str
    amount: float
    email: str
    first_name: str
    last_name: str
    phone: str

def get_chapa_client():
    return httpx.AsyncClient(verify=False, timeout=60.0, follow_redirects=True)

def activate_user(user: User, plan_type: str, amount: float, transaction_id: str, db: Session):
    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=180)
    
    plan_name = str(plan_type).lower().strip() if plan_type else "seller"
    
    print(f"🔧 ACTIVATING USER: {user.email} | Plan: {plan_name}")
    
    user.is_activated = True
    user.payment_approved = True
    user.can_create_listings = True
    user.has_active_subscription = True
    user.subscription_plan = plan_name
    user.subscription_start_date = start_date
    user.subscription_end_date = end_date
    user.status = "active"
    user.is_verified = True
    user.payment_status = "completed"
    
    if hasattr(user, 'activated_at'):
        user.activated_at = start_date
    
    if plan_name == "seller":
        user.role_type = "seller"
        user.seller_enabled = True
        user.seller_approved = True
        user.seller_paid = True
    elif plan_name == "landlord":
        user.role_type = "landlord"
        user.landlord_enabled = True
        user.landlord_approved = True
        user.landlord_paid = True
    elif plan_name == "dual":
        user.role_type = "dual"
        user.seller_enabled = True
        user.seller_approved = True
        user.seller_paid = True
        user.landlord_enabled = True
        user.landlord_approved = True
        user.landlord_paid = True
    
    # 🎯 Use string directly, no .value or ()
    status_string = "fully_activated"
    
    activation_request = db.query(ActivationRequest).filter(
        ActivationRequest.user_id == user.id
    ).order_by(ActivationRequest.created_at.desc()).first()
    
    if activation_request:
        activation_request.status = status_string
        activation_request.plan_type = plan_name
        activation_request.payment_amount = amount
        activation_request.payment_transaction_id = transaction_id
        activation_request.payment_approved_at = datetime.utcnow()
    else:
        new_activation = ActivationRequest(
            user_id=user.id,
            full_name=user.full_name or user.username,
            email=user.email,
            phone_number=user.phone or "",
            property_address="Subscription Activation",
            property_type="activation",
            status=status_string,
            plan_type=plan_name,
            payment_amount=amount,
            payment_transaction_id=transaction_id,
            payment_approved_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        db.add(new_activation)
    
    db.commit()
    print(f"✅ User {user.email} ACTIVATED!")
    return end_date

@router.post("/initialize")
async def initialize_payment(
    payment_data: InitializePaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        plan_str = str(payment_data.plan_type).lower().strip()
        amount_val = float(payment_data.amount)
        
        print(f"💰 Payment initialization for user: {current_user.email} | Plan: {plan_str} | Amount: {amount_val}")
        
        tx_ref = f"{plan_str}-{current_user.id}-{secrets.token_hex(8)}"
        
        payment = PaymentTransaction(
            user_id=current_user.id,
            tx_ref=tx_ref,
            plan_type=plan_str,
            amount=amount_val,
            currency="ETB",
            status="pending",
            payment_status="initiated",
            created_at=datetime.utcnow()
        )
        db.add(payment)
        db.commit()
        
        callback_url = f"{BASE_URL}/api/payment/webhook"
        return_url = f"{FRONTEND_URL}/payment/success?tx_ref={tx_ref}&plan={plan_str}"
        
        async with get_chapa_client() as client:
            response = await client.post(
                f"{CHAPA_BASE_URL}/transaction/initialize",
                headers={
                    "Authorization": f"Bearer {CHAPA_SECRET_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "amount": str(amount_val),
                    "currency": "ETB",
                    "email": str(payment_data.email),
                    "first_name": str(payment_data.first_name),
                    "last_name": str(payment_data.last_name),
                    "phone_number": str(payment_data.phone),
                    "tx_ref": tx_ref,
                    "callback_url": callback_url,
                    "return_url": return_url,
                    "title": f"{plan_str.capitalize()} Plan - 6 Months",
                    "description": f"6 months subscription for {plan_str} account"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success" and data.get("data", {}).get("checkout_url"):
                    return {
                        "success": True,
                        "checkout_url": data["data"]["checkout_url"],
                        "tx_ref": tx_ref
                    }
                else:
                    return {"success": False, "message": data.get("message", "Payment initialization failed")}
            else:
                return {"success": False, "message": f"Gateway error: {response.status_code}"}
                
    except Exception as e:
        print(f"❌ Error initializing payment: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "message": str(e)}

@router.get("/success")
async def payment_success(tx_ref: str, amount: str = None, plan: str = None, db: Session = Depends(get_db)):
    try:
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.tx_ref == tx_ref).first()
        
        if not payment:
            return HTMLResponse(content=f"<html><head><meta http-equiv='refresh' content='3;url={FRONTEND_URL}/dashboard/subscription'></head><body>Payment not found.</body></html>")
        
        if payment.status != "approved":
            payment.status = "approved"
            payment.payment_status = "completed"
            payment.transaction_id = f"DIRECT-{tx_ref}"
            payment.reviewed_at = datetime.utcnow()
            db.commit()
            
            user = db.query(User).filter(User.id == payment.user_id).first()
            if user:
                activate_user(user, payment.plan_type, payment.amount, payment.transaction_id, db)
        
        return HTMLResponse(content=f"<html><head><meta http-equiv='refresh' content='2;url={FRONTEND_URL}/dashboard'></head><body><h1>Payment Successful! Redirecting...</h1></body></html>")
        
    except Exception as e:
        return HTMLResponse(content=f"<html><body><h2>Error: {str(e)}</h2></body></html>")

@router.post("/webhook")
async def chapa_webhook(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
        tx_ref = body.get("tx_ref")
        status = body.get("status")
        
        if not tx_ref:
            return {"status": "error", "message": "No tx_ref"}
        
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.tx_ref == tx_ref).first()
        if not payment:
            return {"status": "error", "message": "Payment not found"}
        
        if status == "success":
            if payment.status == "approved":
                return {"status": "ignored"}
            
            payment.status = "approved"
            payment.payment_status = "completed"
            payment.transaction_id = body.get("transaction_id", tx_ref)
            payment.reviewed_at = datetime.utcnow()
            db.commit()
            
            user = db.query(User).filter(User.id == payment.user_id).first()
            if user:
                activate_user(user, payment.plan_type, payment.amount, payment.transaction_id, db)
                return {"status": "success", "message": "User activated"}
        else:
            payment.status = "failed"
            payment.payment_status = "failed"
            db.commit()
            return {"status": "failed"}
        
        return {"status": "ignored"}
        
    except Exception as e:
        print(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

@router.get("/verify")
async def verify_payment(tx_ref: str, transaction_id: str = None, db: Session = Depends(get_db)):
    try:
        if not tx_ref:
            return {"success": False, "message": "No payment reference"}
        
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.tx_ref == tx_ref).first()
        
        if not payment and transaction_id:
            payment = db.query(PaymentTransaction).filter(PaymentTransaction.transaction_id == transaction_id).first()
        
        if not payment:
            return {"success": False, "message": "Payment not found"}
        
        if payment.status == "approved":
            user = db.query(User).filter(User.id == payment.user_id).first()
            if user and user.is_activated:
                return {"success": True, "message": "Already activated", "activated": True}
        
        async with get_chapa_client() as client:
            response = await client.get(
                f"{CHAPA_BASE_URL}/transaction/verify/{tx_ref}",
                headers={"Authorization": f"Bearer {CHAPA_SECRET_KEY}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    payment.status = "approved"
                    payment.payment_status = "completed"
                    payment.transaction_id = data.get("data", {}).get("transaction_id", tx_ref)
                    payment.reviewed_at = datetime.utcnow()
                    db.commit()
                    
                    user = db.query(User).filter(User.id == payment.user_id).first()
                    if user:
                        end_date = activate_user(user, payment.plan_type, payment.amount, payment.transaction_id, db)
                        return {
                            "success": True,
                            "message": "Payment verified! Account activated.",
                            "activated": True,
                            "subscription_end_date": end_date.isoformat()
                        }
                return {"success": False, "message": data.get("message", "Not successful")}
            return {"success": False, "message": f"Failed: {response.status_code}"}
            
    except Exception as e:
        print(f"Verify error: {e}")
        return {"success": False, "message": str(e)}

@router.get("/admin/payments")
async def get_all_payments(status: str = "all", current_user: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    try:
        query = db.query(PaymentTransaction)
        if status == "pending":
            query = query.filter(PaymentTransaction.status == "pending")
        elif status == "approved":
            query = query.filter(PaymentTransaction.status == "approved")
        
        payments = query.all()
        payments.sort(key=lambda p: p.created_at if p.created_at else datetime.min, reverse=True)
        
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
                "currency": payment.currency,
                "status": payment.status,
                "payment_status": payment.payment_status,
                "transaction_id": payment.transaction_id or payment.tx_ref,
                "created_at": payment.created_at.isoformat() if payment.created_at else None,
                "reviewed_at": payment.reviewed_at.isoformat() if payment.reviewed_at else None,
                "user_is_activated": user.is_activated if user else False
            })
        
        return result
    except Exception as e:
        print(f"Admin payments error: {e}")
        return []

print("✅ Payment router loaded successfully!")