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

class VerifyPaymentRequest(BaseModel):
    tx_ref: str
    transaction_id: str


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
        
        # Create pending payment record
        payment = PaymentTransaction(
            user_id=current_user.id,
            tx_ref=tx_ref,
            plan_type=payment_data.plan_type,
            amount=payment_data.amount,
            currency="ETB",
            status="pending",
            payment_status="initiated"
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)
        
        # Prepare Chapa request
        callback_url = f"{os.getenv('BASE_URL', 'http://localhost:8000')}/api/payment/verify"
        
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
                    "email": current_user.email,
                    "first_name": current_user.full_name or current_user.username,
                    "tx_ref": tx_ref,
                    "callback_url": callback_url,
                    "return_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/subscription",
                    "title": f"{payment_data.plan_type.capitalize()} Plan Subscription"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "checkout_url": data.get("data", {}).get("checkout_url"),
                    "tx_ref": tx_ref
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to initialize payment"
                }
                
    except Exception as e:
        print(f"Error initializing payment: {e}")
        return {"success": False, "message": str(e)}


@router.get("/verify")
async def verify_payment(
    tx_ref: str,
    transaction_id: str = None,
    db: Session = Depends(get_db)
):
    """Verify payment after callback from Chapa"""
    try:
        # Find payment record
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.tx_ref == tx_ref).first()
        
        if not payment:
            return {"success": False, "message": "Payment not found"}
        
        # Verify with Chapa
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CHAPA_BASE_URL}/transaction/verify/{tx_ref}",
                headers={"Authorization": f"Bearer {CHAPA_SECRET_KEY}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    payment.status = "pending"  # Still needs admin approval
                    payment.payment_status = "completed"
                    payment.transaction_id = data.get("data", {}).get("transaction_id")
                    db.commit()
                    
                    return {
                        "success": True,
                        "message": "Payment verified successfully. Waiting for admin approval."
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
    """Get all payments for admin"""
    try:
        query = db.query(PaymentTransaction)
        
        if status == "pending":
            query = query.filter(PaymentTransaction.status == "pending")
        elif status == "approved":
            query = query.filter(PaymentTransaction.status == "approved")
        elif status == "rejected":
            query = query.filter(PaymentTransaction.status == "rejected")
        
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
                "currency": payment.currency,
                "status": payment.status,
                "payment_status": payment.payment_status,
                "transaction_id": payment.transaction_id or payment.tx_ref,
                "rejection_reason": payment.rejection_reason,
                "created_at": payment.created_at.isoformat() if payment.created_at else None,
                "reviewed_at": payment.reviewed_at.isoformat() if payment.reviewed_at else None
            })
        
        return result
        
    except Exception as e:
        print(f"Error getting payments: {e}")
        return []


@router.post("/admin/approve-payment/{payment_id}")
async def approve_payment(
    payment_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Approve a payment and activate user account"""
    try:
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_id).first()
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        if payment.status != "pending":
            raise HTTPException(status_code=400, detail=f"Payment already {payment.status}")
        
        user = db.query(User).filter(User.id == payment.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update payment status
        payment.status = "approved"
        payment.reviewed_by = current_user.id
        payment.reviewed_at = datetime.utcnow()
        
        # Update user - FULLY ACTIVATE
        user.payment_approved = True
        user.can_create_listings = True
        user.payment_status = "approved"
        user.is_activated = True
        user.status = "active"
        user.has_active_subscription = True
        user.subscription_plan = payment.plan_type
        user.subscription_start_date = datetime.utcnow()
        user.subscription_end_date = datetime.utcnow() + timedelta(days=30)
        
        # Enable seller/landlord capabilities
        if payment.plan_type == "seller" or payment.plan_type == "dual":
            user.seller_enabled = True
            user.seller_approved = True
            user.seller_paid = True
        if payment.plan_type == "landlord" or payment.plan_type == "dual":
            user.landlord_enabled = True
            user.landlord_approved = True
            user.landlord_paid = True
        if payment.plan_type == "dual":
            user.role_type = "dual"
        elif payment.plan_type == "seller":
            user.role_type = "seller"
        elif payment.plan_type == "landlord":
            user.role_type = "landlord"
        
        db.commit()
        
        print(f"✅ Payment {payment_id} approved for user {user.email}")
        
        # Note: Notification is handled on the frontend by checking localStorage settings
        # No need to send backend notification for payment approval
        
        return {"success": True, "message": "Payment approved and account activated"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error approving payment: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/reject-payment/{payment_id}")
async def reject_payment(
    payment_id: int,
    rejection_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Reject a payment"""
    try:
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_id).first()
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        if payment.status != "pending":
            raise HTTPException(status_code=400, detail=f"Payment already {payment.status}")
        
        reason = rejection_data.get("reason", "No reason provided")
        
        user = db.query(User).filter(User.id == payment.user_id).first()
        
        # Update payment status
        payment.status = "rejected"
        payment.rejection_reason = reason
        payment.reviewed_by = current_user.id
        payment.reviewed_at = datetime.utcnow()
        
        # Reset user payment flags
        if user:
            user.payment_status = "rejected"
            user.payment_approved = False
            user.can_create_listings = False
            if payment.plan_type == "seller" or payment.plan_type == "dual":
                user.seller_paid = False
                user.seller_enabled = False
                user.seller_approved = False
            if payment.plan_type == "landlord" or payment.plan_type == "dual":
                user.landlord_paid = False
                user.landlord_enabled = False
                user.landlord_approved = False
        
        db.commit()
        
        print(f"❌ Payment {payment_id} rejected for user {user.email if user else 'Unknown'}")
        
        return {"success": True, "message": "Payment rejected"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error rejecting payment: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/receipt/{payment_id}")
async def get_payment_receipt(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get payment receipt details for printing"""
    try:
        # Get payment transaction
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_id).first()
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Get user
        user = db.query(User).filter(User.id == payment.user_id).first()
        
        return {
            "success": True,
            "receipt": {
                "transaction_id": payment.tx_ref or f"TXN-{payment.id}",
                "date": payment.created_at.isoformat() if payment.created_at else datetime.utcnow().isoformat(),
                "plan_type": payment.plan_type,
                "amount": payment.amount,
                "currency": payment.currency or "ETB",
                "status": payment.status,
                "user_name": user.full_name or user.username if user else "Unknown",
                "user_email": user.email if user else "Unknown",
                "user_phone": user.phone if user else "N/A",
                "payment_method": "Chapa",
                "business_name": "EstateHub Real Estate",
                "business_tin": "0071406415",
                "business_phone": "+251-960724272",
                "business_website": "www.estatehub.com",
                "business_address": "Addis Ababa, Ethiopia"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting receipt: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


print("✅ Payment router loaded successfully!")


@router.post("/send-notification/{payment_id}")
async def send_payment_notification(
    payment_id: int,
    request: Request,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Send email notification to admin about payment action"""
    try:
        body = await request.json()
        action = body.get('action')  # 'approved' or 'rejected'
        reason = body.get('reason')
        
        # Get payment details
        payment = db.query(ActivationRequest).filter(ActivationRequest.id == payment_id).first()
        if not payment:
            return {"success": False, "message": "Payment not found"}
        
        # Get user who made the payment
        user = db.query(User).filter(User.id == payment.user_id).first()
        
        # Get all admins
        admins = db.query(User).filter(User.role_type == 'admin').all()
        
        from ..services.email_service import email_service
        from ..services.email_templates import get_payment_approval_email, get_payment_rejection_email
        
        email_sent_count = 0
        
        for admin in admins:
            # Check if admin wants email notifications
            if getattr(admin, 'email_alerts', True):
                if action == 'approved':
                    html_content = get_payment_approval_email(
                        admin_name=admin.full_name or admin.username,
                        user_name=user.full_name or user.username,
                        amount=payment.payment_amount,
                        plan_type=payment.plan_type,
                        transaction_id=payment.payment_transaction_id or f"TXN-{payment.id}"
                    )
                    subject = f"✅ Payment Approved - {payment.plan_type} Plan"
                else:
                    html_content = get_payment_rejection_email(
                        admin_name=admin.full_name or admin.username,
                        user_name=user.full_name or user.username,
                        amount=payment.payment_amount,
                        plan_type=payment.plan_type,
                        reason=reason or "No reason provided"
                    )
                    subject = f"❌ Payment Rejected - {payment.plan_type} Plan"
                
                await email_service.send_email(
                    to_email=admin.email,
                    subject=subject,
                    html_content=html_content,
                    text_content=f"Payment {action} for {payment.payment_amount} ETB"
                )
                email_sent_count += 1
                print(f"📧 Payment notification email sent to {admin.email}")
        
        return {
            "success": True,
            "message": f"Email notification sent to {email_sent_count} admin(s)"
        }
        
    except Exception as e:
        print(f"Error sending email notification: {e}")
        return {"success": False, "message": str(e)}
    
@router.post("/admin/approve-payment/{payment_id}")
async def approve_payment(
    payment_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Approve a payment and activate user account"""
    try:
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_id).first()
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        if payment.status != "pending":
            raise HTTPException(status_code=400, detail=f"Payment already {payment.status}")
        
        user = db.query(User).filter(User.id == payment.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update payment status
        payment.status = "approved"
        payment.reviewed_by = current_user.id
        payment.reviewed_at = datetime.utcnow()
        
        # Update user - FULLY ACTIVATE
        user.payment_approved = True
        user.can_create_listings = True
        user.payment_status = "approved"
        user.is_activated = True
        user.status = "active"
        user.has_active_subscription = True
        user.subscription_plan = payment.plan_type
        user.subscription_start_date = datetime.utcnow()
        user.subscription_end_date = datetime.utcnow() + timedelta(days=30)
        
        # Enable seller/landlord capabilities
        if payment.plan_type == "seller" or payment.plan_type == "dual":
            user.seller_enabled = True
            user.seller_approved = True
            user.seller_paid = True
        if payment.plan_type == "landlord" or payment.plan_type == "dual":
            user.landlord_enabled = True
            user.landlord_approved = True
            user.landlord_paid = True
        if payment.plan_type == "dual":
            user.role_type = "dual"
        elif payment.plan_type == "seller":
            user.role_type = "seller"
        elif payment.plan_type == "landlord":
            user.role_type = "landlord"
        
        db.commit()
        
        print(f"✅ Payment {payment_id} approved for user {user.email}")
        
        # SEND EMAIL NOTIFICATION TO USER
        try:
            from ..services.email_service import email_service
            from ..services.email_templates import get_payment_approved_user_email
            
            html_content = get_payment_approved_user_email(
                user_name=user.full_name or user.username,
                amount=payment.amount,
                plan_type=payment.plan_type,
                transaction_id=payment.transaction_id or payment.tx_ref
            )
            
            await email_service.send_email(
                to_email=user.email,
                subject=f"✅ Payment Approved - Your {payment.plan_type} Plan is Active!",
                html_content=html_content,
                text_content=f"Your payment of {payment.amount} ETB has been approved. Your account is now active."
            )
            print(f"📧 Approval email sent to user: {user.email}")
        except Exception as email_error:
            print(f"⚠️ Failed to send approval email to user: {email_error}")
        
        # Also send notification to admin
        try:
            from ..services.email_service import email_service
            from ..services.email_templates import get_payment_approval_email
            
            admins = db.query(User).filter(User.role_type == 'admin').all()
            for admin in admins:
                if getattr(admin, 'email_alerts', True):
                    html_content = get_payment_approval_email(
                        admin_name=admin.full_name or admin.username,
                        user_name=user.full_name or user.username,
                        amount=payment.amount,
                        plan_type=payment.plan_type,
                        transaction_id=payment.transaction_id or payment.tx_ref
                    )
                    await email_service.send_email(
                        to_email=admin.email,
                        subject=f"✅ Payment Approved - {payment.plan_type} Plan",
                        html_content=html_content,
                        text_content=f"Payment of {payment.amount} ETB from {user.full_name} has been approved"
                    )
        except Exception as email_error:
            print(f"⚠️ Failed to send approval email to admin: {email_error}")
        
        return {"success": True, "message": "Payment approved and account activated"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error approving payment: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))