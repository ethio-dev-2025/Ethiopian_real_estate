from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
import json
import os
import uuid
import shutil
from datetime import datetime, timedelta
from ..database import get_db
from ..models import User, ActivationRequest, ActivationStatus
from .auth import get_current_user, get_current_admin_user
from pydantic import BaseModel

router = APIRouter()

# Create upload directories
UPLOAD_DIR = "uploads/activation_documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ActivationRequestCreate(BaseModel):
    full_name: str
    email: str
    phone_number: str
    property_address: str
    property_type: str
    business_name: Optional[str] = None
    tax_id: Optional[str] = None
    experience_years: int = 0
    previous_listings_count: int = 0
    reason_for_activation: Optional[str] = None
    business_license: Optional[str] = None
    ownership_document: Optional[str] = None
    title_deed: Optional[str] = None
    tax_clearance: Optional[str] = None
    government_id: Optional[str] = None
    property_photos: Optional[str] = None


class PaymentSubmitRequest(BaseModel):
    plan_type: str
    amount: float
    receipt_url: Optional[str] = None
    transaction_id: Optional[str] = None


class RejectRequest(BaseModel):
    rejection_reason: str


# ============ UPLOAD DOCUMENT ============
@router.post("/upload-document")
async def upload_activation_document(
    file: UploadFile = File(...),
    document_type: str = "general",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")
        
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max 10MB")
        
        file_extension = os.path.splitext(file.filename)[1].lower()
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx']
        
        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"File type not allowed")
        
        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        user_upload_dir = os.path.join(UPLOAD_DIR, f"user_{current_user.id}")
        os.makedirs(user_upload_dir, exist_ok=True)
        
        file_path = os.path.join(user_upload_dir, unique_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_url = f"/uploads/activation_documents/user_{current_user.id}/{unique_filename}"
        
        return {
            "success": True,
            "url": file_url,
            "filename": file.filename,
            "document_type": document_type,
            "message": "Document uploaded successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ SUBMIT ACTIVATION REQUEST ============
@router.post("/submit-request")
async def submit_activation_request(
    request_data: ActivationRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        existing_request = db.query(ActivationRequest).filter(
            ActivationRequest.user_id == current_user.id,
            ActivationRequest.status.in_([
                ActivationStatus.DOCUMENTS_PENDING, 
                ActivationStatus.DOCUMENTS_APPROVED, 
                ActivationStatus.PAYMENT_PENDING
            ])
        ).first()
        
        if existing_request:
            raise HTTPException(status_code=400, detail="You already have a pending activation request")
        
        activation_request = ActivationRequest(
            user_id=current_user.id,
            full_name=request_data.full_name or current_user.full_name,
            email=request_data.email or current_user.email,
            phone_number=request_data.phone_number or current_user.phone,
            property_address=request_data.property_address,
            property_type=request_data.property_type,
            business_name=request_data.business_name,
            tax_id=request_data.tax_id,
            experience_years=request_data.experience_years,
            previous_listings_count=request_data.previous_listings_count,
            reason_for_activation=request_data.reason_for_activation,
            business_license=request_data.business_license,
            ownership_document=request_data.ownership_document,
            title_deed=request_data.title_deed,
            tax_clearance=request_data.tax_clearance,
            government_id=request_data.government_id,
            property_photos=request_data.property_photos,
            status=ActivationStatus.DOCUMENTS_PENDING,
            created_at=datetime.utcnow()
        )
        
        db.add(activation_request)
        
        db.commit()
        db.refresh(activation_request)
        
        return {
            "success": True,
            "message": "Activation request submitted successfully",
            "request_id": activation_request.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error submitting request: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ FIXED STATUS ENDPOINT - CRITICAL ============
@router.get("/status")
async def get_activation_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's activation status - CORRECTED VERSION"""
    try:
        print(f"🔍 Getting activation status for user: {current_user.email}")
        print(f"   DB values - is_activated: {current_user.is_activated}")
        print(f"   DB values - can_create_listings: {current_user.can_create_listings}")
        print(f"   DB values - has_active_subscription: {current_user.has_active_subscription}")
        print(f"   DB values - payment_approved: {current_user.payment_approved}")
        print(f"   DB values - subscription_end_date: {current_user.subscription_end_date}")
        
        # Calculate days remaining from subscription_end_date
        days_remaining = 0
        subscription_end_date = None
        has_valid_subscription = False
        
        if current_user.subscription_end_date:
            subscription_end_date = current_user.subscription_end_date
            days_remaining = (current_user.subscription_end_date - datetime.utcnow()).days
            if days_remaining > 0:
                has_valid_subscription = True
            else:
                days_remaining = 0
        
        # IMPORTANT: Check if user is FULLY ACTIVATED based on DATABASE values
        # User is only active if ALL conditions are met:
        # 1. is_activated is True
        # 2. can_create_listings is True  
        # 3. has_active_subscription is True
        # 4. payment_approved is True
        # 5. subscription_end_date is in the future (days_remaining > 0)
        
        is_fully_active = (
            current_user.is_activated == True and
            current_user.can_create_listings == True and
            current_user.has_active_subscription == True and
            current_user.payment_approved == True and
            days_remaining > 0
        )
        
        # If user is fully active, return fully_activated
        if is_fully_active:
            print(f"✅ User {current_user.email} is FULLY ACTIVATED")
            return {
                "is_activated": True,
                "status": "fully_activated",
                "message": f"Account fully activated! {days_remaining} days remaining",
                "can_create_listings": True,
                "has_active_subscription": True,
                "days_remaining": days_remaining,
                "subscription_end_date": subscription_end_date.isoformat() if subscription_end_date else None,
                "subscription_plan": current_user.subscription_plan,
                "payment_approved": True
            }
        
        # Check if subscription expired (was active but now expired)
        if current_user.subscription_end_date and days_remaining <= 0 and current_user.payment_approved:
            print(f"⚠️ User {current_user.email} subscription EXPIRED")
            return {
                "is_activated": False,
                "status": "subscription_expired",
                "message": "Your subscription has expired. Please renew to continue.",
                "can_create_listings": False,
                "has_active_subscription": False,
                "days_remaining": 0,
                "subscription_end_date": subscription_end_date.isoformat() if subscription_end_date else None,
                "subscription_plan": current_user.subscription_plan,
                "needs_renewal": True
            }
        
        # Check for activation request
        activation_request = db.query(ActivationRequest).filter(
            ActivationRequest.user_id == current_user.id
        ).order_by(ActivationRequest.created_at.desc()).first()
        
        # NEW USER - no activation request yet
        if not activation_request:
            print(f"📝 User {current_user.email} has NO activation request")
            return {
                "is_activated": False,
                "status": "not_submitted",
                "message": "Please submit activation request to start",
                "can_create_listings": False,
                "has_active_subscription": False,
                "days_remaining": 0,
                "subscription_end_date": None,
                "subscription_plan": None,
                "payment_approved": False
            }
        
        # Map status from activation request
        if activation_request.status == ActivationStatus.DOCUMENTS_PENDING:
            print(f"📄 User {current_user.email} documents PENDING")
            return {
                "is_activated": False,
                "status": "documents_pending",
                "message": "Documents submitted, waiting for admin review",
                "can_create_listings": False,
                "has_active_subscription": False,
                "days_remaining": 0,
                "subscription_end_date": None,
                "subscription_plan": None,
                "payment_approved": False
            }
        
        elif activation_request.status == ActivationStatus.DOCUMENTS_APPROVED:
            print(f"✅ User {current_user.email} documents APPROVED - needs payment")
            return {
                "is_activated": False,
                "status": "documents_approved",
                "message": "Documents approved! Please subscribe to activate",
                "can_create_listings": False,
                "has_active_subscription": False,
                "days_remaining": 0,
                "subscription_end_date": None,
                "subscription_plan": activation_request.plan_type,
                "payment_approved": False
            }
        
        elif activation_request.status == ActivationStatus.PAYMENT_PENDING:
            print(f"💰 User {current_user.email} payment PENDING")
            return {
                "is_activated": False,
                "status": "payment_pending",
                "message": "Payment submitted, waiting for verification",
                "can_create_listings": False,
                "has_active_subscription": False,
                "days_remaining": 0,
                "subscription_end_date": None,
                "subscription_plan": activation_request.plan_type,
                "payment_approved": False
            }
        
        elif activation_request.status == ActivationStatus.FULLY_ACTIVATED:
            # This should have been caught above, but just in case
            if days_remaining > 0:
                return {
                    "is_activated": True,
                    "status": "fully_activated",
                    "message": f"Account fully activated! {days_remaining} days remaining",
                    "can_create_listings": True,
                    "has_active_subscription": True,
                    "days_remaining": days_remaining,
                    "subscription_end_date": subscription_end_date.isoformat() if subscription_end_date else None,
                    "subscription_plan": current_user.subscription_plan or activation_request.plan_type,
                    "payment_approved": True
                }
            else:
                return {
                    "is_activated": False,
                    "status": "subscription_expired",
                    "message": "Subscription expired. Please renew.",
                    "can_create_listings": False,
                    "has_active_subscription": False,
                    "days_remaining": 0,
                    "subscription_end_date": subscription_end_date.isoformat() if subscription_end_date else None,
                    "subscription_plan": current_user.subscription_plan,
                    "needs_renewal": True
                }
        
        elif activation_request.status == ActivationStatus.REJECTED:
            print(f"❌ User {current_user.email} REJECTED")
            return {
                "is_activated": False,
                "status": "rejected",
                "message": f"Rejected: {activation_request.rejection_reason}",
                "can_create_listings": False,
                "has_active_subscription": False,
                "days_remaining": 0,
                "subscription_end_date": None,
                "subscription_plan": None,
                "payment_approved": False
            }
        
        # Default fallback
        return {
            "is_activated": False,
            "status": "unknown",
            "message": "Unknown status",
            "can_create_listings": False,
            "has_active_subscription": False,
            "days_remaining": 0,
            "subscription_end_date": None,
            "subscription_plan": None,
            "payment_approved": False
        }
        
    except Exception as e:
        print(f"Error getting status: {e}")
        import traceback
        traceback.print_exc()
        return {
            "is_activated": False, 
            "status": "error", 
            "message": str(e), 
            "can_create_listings": False, 
            "has_active_subscription": False,
            "days_remaining": 0,
            "subscription_end_date": None,
            "subscription_plan": None,
            "payment_approved": False
        }


# ============ ADMIN ENDPOINTS ============
@router.get("/admin/pending-documents")
async def get_pending_document_requests(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        requests = db.query(ActivationRequest).filter(
            ActivationRequest.status == ActivationStatus.DOCUMENTS_PENDING
        ).order_by(ActivationRequest.created_at.desc()).all()
        
        result = []
        for req in requests:
            user = db.query(User).filter(User.id == req.user_id).first()
            result.append({
                "id": req.id,
                "user_id": req.user_id,
                "full_name": req.full_name,
                "email": req.email,
                "phone_number": req.phone_number,
                "property_address": req.property_address,
                "property_type": req.property_type,
                "business_name": req.business_name,
                "business_license": req.business_license,
                "ownership_document": req.ownership_document,
                "title_deed": req.title_deed,
                "tax_clearance": req.tax_clearance,
                "government_id": req.government_id,
                "created_at": req.created_at.isoformat() if req.created_at else None,
                "status": req.status,
                "user_name": user.full_name if user else req.full_name,
                "user_email": user.email if user else req.email
            })
        
        return result
        
    except Exception as e:
        print(f"Error: {e}")
        return []


@router.post("/admin/approve-documents/{request_id}")
async def approve_documents(
    request_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        activation_request = db.query(ActivationRequest).filter(
            ActivationRequest.id == request_id
        ).first()
        
        if not activation_request:
            raise HTTPException(status_code=404, detail="Activation request not found")
        
        if activation_request.status != ActivationStatus.DOCUMENTS_PENDING:
            raise HTTPException(status_code=400, detail="This request is not in documents pending state")
        
        activation_request.status = ActivationStatus.DOCUMENTS_APPROVED
        activation_request.reviewed_by = current_user.id
        activation_request.reviewed_at = datetime.utcnow()
        
        db.commit()
        
        return {"success": True, "message": "Documents approved! User can now subscribe"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/approve-payment/{request_id}")
async def approve_payment(
    request_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        activation_request = db.query(ActivationRequest).filter(
            ActivationRequest.id == request_id
        ).first()
        
        if not activation_request:
            raise HTTPException(status_code=404, detail="Activation request not found")
        
        if activation_request.status != ActivationStatus.PAYMENT_PENDING:
            raise HTTPException(status_code=400, detail="This request is not in payment pending state")
        
        activation_request.status = ActivationStatus.FULLY_ACTIVATED
        activation_request.payment_approved_by = current_user.id
        activation_request.payment_approved_at = datetime.utcnow()
        
        user = db.query(User).filter(User.id == activation_request.user_id).first()
        if user:
            user.is_activated = True
            user.payment_approved = True
            user.can_create_listings = True
            user.has_active_subscription = True
            user.subscription_plan = activation_request.plan_type
            user.subscription_start_date = datetime.utcnow()
            user.subscription_end_date = datetime.utcnow() + timedelta(days=180)
            user.activated_at = datetime.utcnow()
            user.status = "active"
            
            if activation_request.plan_type == 'seller':
                user.role_type = 'seller'
                user.seller_enabled = True
                user.seller_approved = True
                user.seller_paid = True
            elif activation_request.plan_type == 'landlord':
                user.role_type = 'landlord'
                user.landlord_enabled = True
                user.landlord_approved = True
                user.landlord_paid = True
            elif activation_request.plan_type == 'dual':
                user.role_type = 'dual'
                user.seller_enabled = True
                user.seller_approved = True
                user.seller_paid = True
                user.landlord_enabled = True
                user.landlord_approved = True
                user.landlord_paid = True
        
        db.commit()
        
        return {"success": True, "message": "Payment approved! Account activated."}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


print("✅ Activation router loaded successfully with FIXED status endpoint!")