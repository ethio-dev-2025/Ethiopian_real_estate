# backend/app/routers/payment.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
import secrets
from datetime import datetime, timedelta
from ..database import get_db
from ..models import User, PaymentTransaction, ActivationRequest
from ..models.activation import ActivationStatus
from .auth import get_current_user, get_current_admin_user
from pydantic import BaseModel
import httpx
import os
import warnings
import json

router = APIRouter()

# Suppress SSL warnings
warnings.filterwarnings("ignore")

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


def get_chapa_client():
    """Create an httpx client for Chapa"""
    return httpx.AsyncClient(
        verify=False,
        timeout=60.0,
        follow_redirects=True
    )


def activate_user(user: User, plan_type: str, amount: float, transaction_id: str, db: Session):
    """Helper function to activate/renew a user"""
    start_date = datetime.now()
    end_date = start_date + timedelta(days=180)
    
    print(f"🔧 ACTIVATING USER: {user.email}")
    print(f"   - Plan: {plan_type}")
    print(f"   - Amount: {amount}")
    print(f"   - End Date: {end_date}")
    
    # Update user fields
    user.is_activated = True
    user.payment_approved = True
    user.can_create_listings = True
    user.has_active_subscription = True
    user.subscription_plan = plan_type
    user.subscription_start_date = start_date
    user.subscription_end_date = end_date
    user.activated_at = start_date
    user.status = "active"
    user.is_verified = True
    user.payment_status = "completed"
    
    # Set role-specific flags
    if plan_type == "seller":
        user.role_type = "seller"
        user.seller_enabled = True
        user.seller_approved = True
        user.seller_paid = True
    elif plan_type == "landlord":
        user.role_type = "landlord"
        user.landlord_enabled = True
        user.landlord_approved = True
        user.landlord_paid = True
    elif plan_type == "dual":
        user.role_type = "dual"
        user.seller_enabled = True
        user.seller_approved = True
        user.seller_paid = True
        user.landlord_enabled = True
        user.landlord_approved = True
        user.landlord_paid = True
    
    # Update activation request
    activation_request = db.query(ActivationRequest).filter(
        ActivationRequest.user_id == user.id
    ).order_by(ActivationRequest.created_at.desc()).first()
    
    if activation_request:
        activation_request.status = ActivationStatus.FULLY_ACTIVATED
        activation_request.payment_approved_by = user.id
        activation_request.payment_approved_at = datetime.now()
        activation_request.plan_type = plan_type
        activation_request.payment_amount = amount
        activation_request.payment_transaction_id = transaction_id
    else:
        new_activation = ActivationRequest(
            user_id=user.id,
            full_name=user.full_name or user.username,
            email=user.email,
            phone_number=user.phone or "",
            property_address="Subscription Activation",
            property_type="activation",
            status=ActivationStatus.FULLY_ACTIVATED,
            plan_type=plan_type,
            payment_amount=amount,
            payment_transaction_id=transaction_id,
            payment_approved_by=user.id,
            payment_approved_at=datetime.now(),
            created_at=datetime.now()
        )
        db.add(new_activation)
    
    db.commit()
    print(f"✅ User {user.email} ACTIVATED! Subscription valid until {end_date}")
    
    return end_date


# backend/app/routers/payment.py - Update the initialize endpoint
@router.post("/initialize")
async def initialize_payment(
    payment_data: InitializePaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Initialize a payment with Chapa"""
    try:
        print(f"💰 Payment initialization for user: {current_user.email}")
        
        tx_ref = f"{payment_data.plan_type}-{current_user.id}-{secrets.token_hex(8)}"
        
        # Create pending payment record
        payment = PaymentTransaction(
            user_id=current_user.id,
            tx_ref=tx_ref,
            plan_type=payment_data.plan_type,
            amount=payment_data.amount,
            currency="ETB",
            status="pending",
            payment_status="initiated",
            created_at=datetime.now()
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)
        
        # IMPORTANT: Use the correct return URL format that Chapa expects
        callback_url = f"http://localhost:8000/api/payment/webhook"
        # Chapa expects the tx_ref parameter
        return_url = f"http://localhost:5173/payment/success?tx_ref={tx_ref}"
        
        print(f"   - Plan: {payment_data.plan_type}")
        print(f"   - Amount: {payment_data.amount} ETB")
        print(f"   - TX Ref: {tx_ref}")
        print(f"   - Return URL: {return_url}")
        
        async with get_chapa_client() as client:
            response = await client.post(
                f"{CHAPA_BASE_URL}/transaction/initialize",
                headers={
                    "Authorization": f"Bearer {CHAPA_SECRET_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "amount": str(payment_data.amount),
                    "currency": "ETB",
                    "email": payment_data.email,
                    "first_name": payment_data.first_name,
                    "last_name": payment_data.last_name,
                    "phone_number": payment_data.phone,
                    "tx_ref": tx_ref,
                    "callback_url": callback_url,
                    "return_url": return_url,
                    "title": f"{payment_data.plan_type.capitalize()} Plan - 6 Months Subscription",
                    "description": f"6 months subscription for {payment_data.plan_type} account"
                }
            )
            
            print(f"📡 Chapa response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"📦 Chapa response: {data}")
                
                if data.get("status") == "success" and data.get("data", {}).get("checkout_url"):
                    return {
                        "success": True,
                        "checkout_url": data["data"]["checkout_url"],
                        "tx_ref": tx_ref
                    }
                else:
                    error_msg = data.get("message", "Payment initialization failed")
                    print(f"❌ Chapa error: {error_msg}")
                    return {"success": False, "message": error_msg}
            else:
                error_text = await response.text()
                print(f"❌ Chapa HTTP error: {response.status_code} - {error_text}")
                return {"success": False, "message": f"Payment gateway error: {response.status_code}"}
                
    except Exception as e:
        print(f"❌ Error initializing payment: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "message": str(e)}


from fastapi.responses import HTMLResponse

@router.get("/success")
async def payment_success(
    tx_ref: str,
    amount: str = None,
    plan: str = None,
    db: Session = Depends(get_db)
):
    """Direct payment success endpoint - returns HTML redirect"""
    try:
        print(f"💰 DIRECT PAYMENT SUCCESS for tx_ref: {tx_ref}")
        
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.tx_ref == tx_ref).first()
        
        if not payment:
            return HTMLResponse(content="""
            <!DOCTYPE html>
            <html>
            <head><title>Payment Error</title><meta http-equiv="refresh" content="3;url=/dashboard/subscription"></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
                <h2>Payment Not Found</h2>
                <p>Redirecting...</p>
            </body>
            </html>
            """)
        
        # Update payment status if not already approved
        if payment.status != "approved":
            payment.status = "approved"
            payment.payment_status = "completed"
            payment.transaction_id = f"DIRECT-{tx_ref}"
            payment.reviewed_at = datetime.now()
            db.commit()
            
            # Get user and activate
            user = db.query(User).filter(User.id == payment.user_id).first()
            if user:
                end_date = activate_user(user, payment.plan_type, payment.amount, payment.transaction_id, db)
        
        # Return HTML that redirects to dashboard
        return HTMLResponse(content=f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Payment Successful</title>
            <meta http-equiv="refresh" content="2;url=http://localhost:5173/dashboard">
            <style>
                body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; }}
                .container {{ background: white; border-radius: 20px; padding: 40px; max-width: 500px; margin: 0 auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }}
                .check {{ width: 80px; height: 80px; background: #10b981; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }}
                .check svg {{ width: 50px; height: 50px; color: white; }}
                h1 {{ color: #10b981; margin-bottom: 10px; }}
                p {{ color: #666; margin: 10px 0; }}
                .plan {{ background: #f0fdf4; padding: 10px; border-radius: 10px; margin: 20px 0; }}
                a {{ color: #667eea; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="check">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <h1>Payment Successful!</h1>
                <div class="plan">
                    <strong>🎉 Your account has been activated!</strong><br>
                    You can now start creating listings.
                </div>
                <p>Redirecting to dashboard in 2 seconds...</p>
                <p><a href="http://localhost:5173/dashboard">Click here if not redirected</a></p>
            </div>
        </body>
        </html>
        """)
        
    except Exception as e:
        print(f"Error in direct success: {e}")
        return HTMLResponse(content=f"""
        <!DOCTYPE html>
        <html>
        <head><title>Payment Error</title><meta http-equiv="refresh" content="3;url=http://localhost:5173/dashboard/subscription"></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h2 style="color: red;">Error: {str(e)}</h2>
            <p>Redirecting to subscription page...</p>
        </body>
        </html>
        """)


@router.post("/webhook")
async def chapa_webhook(request: Request, db: Session = Depends(get_db)):
    """Chapa webhook to auto-activate user on successful payment"""
    try:
        body = await request.json()
        print(f"📦 Webhook received: {body}")
        
        tx_ref = body.get("tx_ref")
        status = body.get("status")
        
        if not tx_ref:
            return {"status": "error", "message": "No tx_ref"}
        
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.tx_ref == tx_ref).first()
        if not payment:
            print(f"❌ Payment not found for tx_ref: {tx_ref}")
            return {"status": "error", "message": "Payment not found"}
        
        if status == "success":
            if payment.status == "approved":
                return {"status": "ignored", "message": "Already approved"}
            
            # Update payment status
            payment.status = "approved"
            payment.payment_status = "completed"
            payment.transaction_id = body.get("transaction_id", tx_ref)
            payment.reviewed_at = datetime.now()
            db.commit()
            
            # Get user and activate
            user = db.query(User).filter(User.id == payment.user_id).first()
            if user:
                end_date = activate_user(user, payment.plan_type, payment.amount, payment.transaction_id, db)
                print(f"✅ User {user.email} activated via webhook! Valid until {end_date}")
                
                return {"status": "success", "message": "User activated"}
        else:
            print(f"❌ Payment failed for tx_ref: {tx_ref}, status: {status}")
            payment.status = "failed"
            payment.payment_status = "failed"
            db.commit()
            return {"status": "failed", "message": "Payment failed"}
        
        return {"status": "ignored"}
        
    except Exception as e:
        print(f"Webhook error: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}


@router.get("/verify")
async def verify_payment(
    tx_ref: str,
    transaction_id: str = None,
    db: Session = Depends(get_db)
):
    """Verify payment - called when user returns from Chapa"""
    try:
        print(f"🔍 VERIFYING PAYMENT for tx_ref: {tx_ref}")
        
        if not tx_ref:
            return {"success": False, "message": "No payment reference found"}
        
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.tx_ref == tx_ref).first()
        
        if not payment:
            print(f"❌ Payment not found for tx_ref: {tx_ref}")
            # Try to find by transaction_id if provided
            if transaction_id:
                payment = db.query(PaymentTransaction).filter(PaymentTransaction.transaction_id == transaction_id).first()
            if not payment:
                return {"success": False, "message": "Payment not found"}
        
        # If already approved, return success
        if payment.status == "approved":
            user = db.query(User).filter(User.id == payment.user_id).first()
            if user and user.is_activated:
                return {
                    "success": True,
                    "message": "Account already activated!",
                    "activated": True
                }
        
        # Verify with Chapa API
        async with get_chapa_client() as client:
            response = await client.get(
                f"{CHAPA_BASE_URL}/transaction/verify/{tx_ref}",
                headers={"Authorization": f"Bearer {CHAPA_SECRET_KEY}"}
            )
            
            print(f"📡 Chapa verify response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"📦 Chapa verify data: {data}")
                
                if data.get("status") == "success":
                    # Update payment status
                    payment.status = "approved"
                    payment.payment_status = "completed"
                    payment.transaction_id = data.get("data", {}).get("transaction_id", tx_ref)
                    payment.reviewed_at = datetime.now()
                    db.commit()
                    
                    # Get user and activate
                    user = db.query(User).filter(User.id == payment.user_id).first()
                    if user:
                        end_date = activate_user(user, payment.plan_type, payment.amount, payment.transaction_id, db)
                        
                        return {
                            "success": True,
                            "message": "Payment verified! Account activated.",
                            "activated": True,
                            "subscription_end_date": end_date.isoformat()
                        }
                    else:
                        return {"success": False, "message": "User not found"}
                else:
                    return {"success": False, "message": data.get("message", "Payment not successful")}
            else:
                return {"success": False, "message": f"Verification failed: {response.status_code}"}
            
    except Exception as e:
        print(f"Error verifying payment: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "message": str(e)}


@router.get("/admin/payments")
async def get_all_payments(
    status: str = "all",
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all payments for admin"""
    try:
        query = db.query(PaymentTransaction)
        
        if status == "pending":
            query = query.filter(PaymentTransaction.status == "pending")
        elif status == "approved":
            query = query.filter(PaymentTransaction.status == "approved")
        
        payments = query.order_by(PaymentTransaction.created_at.desc()).all()
        
        result = []
        for payment in payments:
            user = db.query(User).filter(User.id == payment.user_id).first()
            
            result.append({
                "id": payment.id,
                "user_id": payment.user_id,
                "user_name": user.full_name or user.username if user else "Unknown",
                "user_email": user.email if user else "Unknown",
                "plan_type": payment.plan_type,
                "amount": payment.amount,
                "status": payment.status,
                "payment_status": payment.payment_status,
                "transaction_id": payment.transaction_id or payment.tx_ref,
                "created_at": payment.created_at.isoformat() if payment.created_at else None,
                "user_is_activated": user.is_activated if user else False
            })
        
        return result
        
    except Exception as e:
        print(f"Error getting payments: {e}")
        return []


print("✅ Payment router loaded with direct mode!")