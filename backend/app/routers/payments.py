# backend/app/routers/payment.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
import secrets
import hmac
import hashlib
from datetime import datetime, timedelta
from ..database import get_db
from ..models import User, PaymentTransaction, ActivationRequest
from ..models.activation import ActivationStatus
from .auth import get_current_user, get_current_admin_user
from pydantic import BaseModel
import httpx
import os

router = APIRouter()

# Chapa configuration
CHAPA_SECRET_KEY = os.getenv("CHAPA_SECRET_KEY", "CHASECK_TEST-fbdEa9IuLsnknOdqwiU8qSUtiNNKrips")
CHAPA_BASE_URL = "https://api.chapa.co/v1"

class InitializePaymentRequest(BaseModel):
    plan_type: str
    amount: float
    email: str
    first_name: str
    last_name: str
    phone: str


@router.post("/initialize")
async def initialize_payment(
    payment_data: InitializePaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Initialize a payment with Chapa"""
    try:
        # Generate unique transaction reference
        tx_ref = f"{payment_data.plan_type}-{current_user.id}-{secrets.token_hex(8)}"
        
        # Create pending payment record with correct timezone
        payment = PaymentTransaction(
            user_id=current_user.id,
            tx_ref=tx_ref,
            plan_type=payment_data.plan_type,
            amount=payment_data.amount,
            currency="ETB",
            status="pending",
            payment_status="initiated",
            created_at=datetime.now()  # Use local time
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)
        
        # Prepare Chapa request
        callback_url = f"{os.getenv('BASE_URL', 'http://localhost:8000')}/api/payment/webhook"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{CHAPA_BASE_URL}/transaction/initialize",
                headers={
                    "Authorization": f"Bearer {CHAPA_SECRET_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "amount": payment_data.amount,
                    "currency": "ETB",
                    "email": payment_data.email,
                    "first_name": payment_data.first_name,
                    "last_name": payment_data.last_name,
                    "phone_number": payment_data.phone,
                    "tx_ref": tx_ref,
                    "callback_url": callback_url,
                    "return_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/payment/success?tx_ref={tx_ref}",
                    "title": f"{payment_data.plan_type.capitalize()} Plan - 6 Months Subscription"
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
                return {"success": False, "message": f"HTTP {response.status_code}"}
                
    except Exception as e:
        print(f"Error initializing payment: {e}")
        return {"success": False, "message": str(e)}


@router.post("/webhook")
async def chapa_webhook(request: Request, db: Session = Depends(get_db)):
    """Chapa webhook to auto-activate user on successful payment"""
    try:
        body = await request.json()
        print(f"📦 Webhook received: {body}")
        
        tx_ref = body.get("tx_ref")
        status = body.get("status")
        
        if status != "success":
            return {"status": "ignored", "message": "Payment not successful"}
        
        # Find payment record
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.tx_ref == tx_ref).first()
        if not payment:
            return {"status": "error", "message": "Payment not found"}
        
        if payment.status == "approved":
            return {"status": "ignored", "message": "Already approved"}
        
        # Update payment status
        payment.status = "approved"
        payment.payment_status = "completed"
        payment.transaction_id = body.get("transaction_id", tx_ref)
        payment.reviewed_at = datetime.now()
        
        # Get user
        user = db.query(User).filter(User.id == payment.user_id).first()
        if not user:
            return {"status": "error", "message": "User not found"}
        
        # Calculate 6 months from now
        start_date = datetime.now()
        end_date = start_date + timedelta(days=180)  # 6 months
        
        # ACTIVATE USER AUTOMATICALLY
        user.is_activated = True
        user.payment_approved = True
        user.can_create_listings = True
        user.has_active_subscription = True
        user.subscription_plan = payment.plan_type
        user.subscription_start_date = start_date
        user.subscription_end_date = end_date
        user.activated_at = start_date
        user.status = "active"
        user.is_verified = True
        user.payment_status = "completed"
        
        # Update activation request if exists
        activation_request = db.query(ActivationRequest).filter(
            ActivationRequest.user_id == user.id,
            ActivationRequest.status == ActivationStatus.DOCUMENTS_APPROVED
        ).first()
        
        if activation_request:
            activation_request.status = ActivationStatus.FULLY_ACTIVATED
            activation_request.payment_approved_by = user.id
            activation_request.payment_approved_at = datetime.now()
            activation_request.plan_type = payment.plan_type
            activation_request.payment_amount = payment.amount
            activation_request.payment_transaction_id = payment.transaction_id
        
        # Set role-specific flags
        if payment.plan_type == "seller":
            user.role_type = "seller"
            user.seller_enabled = True
            user.seller_approved = True
            user.seller_paid = True
        elif payment.plan_type == "landlord":
            user.role_type = "landlord"
            user.landlord_enabled = True
            user.landlord_approved = True
            user.landlord_paid = True
        elif payment.plan_type == "dual":
            user.role_type = "dual"
            user.seller_enabled = True
            user.seller_approved = True
            user.seller_paid = True
            user.landlord_enabled = True
            user.landlord_approved = True
            user.landlord_paid = True
        
        db.commit()
        
        print(f"✅ User {user.email} automatically activated! Subscription valid until {end_date}")
        
        # Send email notification
        try:
            from ..services.email_service import email_service
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head><title>Payment Successful - Account Activated</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #10b981;">✅ Payment Successful!</h2>
                <p>Hello <strong>{user.full_name or user.username}</strong>,</p>
                <p>Your payment has been received and your account is now <strong>ACTIVATED</strong>!</p>
                <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p><strong>Plan:</strong> {payment.plan_type}</p>
                    <p><strong>Amount:</strong> {payment.amount} ETB</p>
                    <p><strong>Valid Until:</strong> {end_date.strftime('%B %d, %Y')}</p>
                </div>
                <p>You can now start creating listings on EstateHub.</p>
                <a href="http://localhost:5173/dashboard" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
                <hr>
                <p style="color: #666; font-size: 12px;">EstateHub Real Estate</p>
            </body>
            </html>
            """
            
            await email_service.send_email(
                to_email=user.email,
                subject=f"✅ Account Activated - {payment.plan_type} Plan",
                html_content=html_content,
                text_content=f"Your account has been activated. Valid until {end_date.strftime('%B %d, %Y')}"
            )
            print(f"📧 Activation email sent to user: {user.email}")
        except Exception as email_error:
            print(f"⚠️ Failed to send email: {email_error}")
        
        return {"status": "success", "message": "User activated"}
        
    except Exception as e:
        print(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/verify")
async def verify_payment(
    tx_ref: str,
    transaction_id: str = None,
    db: Session = Depends(get_db)
):
    """Verify payment after return from Chapa"""
    try:
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.tx_ref == tx_ref).first()
        
        if not payment:
            return {"success": False, "message": "Payment not found"}
        
        if payment.status == "approved":
            return {
                "success": True, 
                "message": "Payment already verified and account activated!",
                "activated": True
            }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CHAPA_BASE_URL}/transaction/verify/{tx_ref}",
                headers={"Authorization": f"Bearer {CHAPA_SECRET_KEY}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    payment.status = "approved"
                    payment.payment_status = "completed"
                    payment.transaction_id = data.get("data", {}).get("transaction_id")
                    
                    user = db.query(User).filter(User.id == payment.user_id).first()
                    if user:
                        end_date = datetime.now() + timedelta(days=180)
                        user.is_activated = True
                        user.payment_approved = True
                        user.can_create_listings = True
                        user.has_active_subscription = True
                        user.subscription_plan = payment.plan_type
                        user.subscription_start_date = datetime.now()
                        user.subscription_end_date = end_date
                        user.status = "active"
                        
                        if payment.plan_type == "seller":
                            user.role_type = "seller"
                        elif payment.plan_type == "landlord":
                            user.role_type = "landlord"
                        elif payment.plan_type == "dual":
                            user.role_type = "dual"
                    
                    db.commit()
                    
                    return {
                        "success": True,
                        "message": "Payment verified! Account activated.",
                        "activated": True
                    }
            
            return {"success": False, "message": "Payment verification failed"}
            
    except Exception as e:
        print(f"Error verifying payment: {e}")
        return {"success": False, "message": str(e)}


@router.get("/admin/payments")
async def get_all_payments(
    status: str = "all",
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all payments for admin (Payment History)"""
    try:
        query = db.query(PaymentTransaction)
        
        if status == "pending":
            query = query.filter(PaymentTransaction.status == "pending")
        elif status == "approved":
            query = query.filter(PaymentTransaction.status == "approved")
        elif status == "rejected":
            query = query.filter(PaymentTransaction.status == "rejected")
        
        # Sort by created_at DESC (newest first)
        payments = query.order_by(PaymentTransaction.created_at.desc()).all()
        
        result = []
        for payment in payments:
            user = db.query(User).filter(User.id == payment.user_id).first()
            
            created_at_str = None
            if payment.created_at:
                created_at_str = payment.created_at.isoformat()
            
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
                "created_at": created_at_str,
                "reviewed_at": payment.reviewed_at.isoformat() if payment.reviewed_at else None,
                "subscription_end_date": user.subscription_end_date.isoformat() if user and user.subscription_end_date else None
            })
        
        return result
        
    except Exception as e:
        print(f"Error getting payments: {e}")
        return []


@router.get("/receipt/{payment_id}")
async def get_payment_receipt(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get payment receipt details for printing"""
    try:
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_id).first()
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        user = db.query(User).filter(User.id == payment.user_id).first()
        
        return {
            "success": True,
            "receipt": {
                "transaction_id": payment.transaction_id or payment.tx_ref,
                "date": payment.created_at.isoformat() if payment.created_at else datetime.now().isoformat(),
                "plan_type": payment.plan_type,
                "amount": payment.amount,
                "currency": payment.currency or "ETB",
                "status": payment.status,
                "user_name": user.full_name or user.username if user else "Unknown",
                "user_email": user.email if user else "Unknown",
                "user_phone": user.phone if user else "N/A",
                "subscription_end_date": user.subscription_end_date.strftime('%Y-%m-%d') if user and user.subscription_end_date else "N/A",
                "payment_method": "Chapa",
                "business_name": "EstateHub Real Estate",
                "business_tin": "0071406415",
                "business_phone": "+251-960724272",
                "business_website": "www.estatehub.com",
                "business_address": "Addis Ababa, Ethiopia"
            }
        }
        
    except Exception as e:
        print(f"Error getting receipt: {e}")
        raise HTTPException(status_code=500, detail=str(e))


print("✅ Payment router loaded with auto-activation on payment!")