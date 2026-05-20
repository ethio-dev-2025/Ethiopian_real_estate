# app/routers/activation.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional, List
import json
import os
import uuid
import shutil
from datetime import datetime
from ..database import get_db
from ..models import User, ActivationRequest, ActivationStatus
from .auth import get_current_user, get_current_admin_user
from pydantic import BaseModel
from fastapi.responses import JSONResponse

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


# ============ TEST ENDPOINT ============
@router.get("/test")
async def test_endpoint():
    return {"status": "ok", "message": "Activation router is working"}


# ============ HEALTH CHECK ============
@router.get("/health")
async def health_check():
    return {"status": "ok", "message": "Activation router is working"}


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
        # Check for existing pending request
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


# ============ GET ACTIVATION STATUS ============
@router.get("/status")
async def get_activation_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # First check if user is a buyer - buyers are always activated
        if current_user.role_type == 'buyer':
            return {
                "is_activated": True,
                "status": "fully_activated",
                "message": "Buyer account is active",
                "can_create_listings": False
            }
        
        # Check if fully activated
        if current_user.can_create_listings and current_user.is_activated and current_user.payment_approved:
            return {
                "is_activated": True, 
                "status": "fully_activated", 
                "message": "Account fully activated! You can now create listings",
                "can_create_listings": True
            }
        
        # Get the latest activation request
        activation_request = db.query(ActivationRequest).filter(
            ActivationRequest.user_id == current_user.id
        ).order_by(ActivationRequest.created_at.desc()).first()
        
        if not activation_request:
            return {
                "is_activated": False, 
                "status": "not_submitted", 
                "message": "Please submit activation request",
                "can_create_listings": False
            }
        
        # Map status to response
        status_map = {
            ActivationStatus.DOCUMENTS_PENDING: {
                "status": "documents_pending",
                "message": "Documents submitted, waiting for admin review",
                "can_create_listings": False
            },
            ActivationStatus.DOCUMENTS_APPROVED: {
                "status": "documents_approved",
                "message": "Documents approved! Please subscribe to activate your account",
                "can_create_listings": False
            },
            ActivationStatus.PAYMENT_PENDING: {
                "status": "payment_pending",
                "message": "Payment submitted, waiting for admin verification",
                "can_create_listings": False
            },
            ActivationStatus.FULLY_ACTIVATED: {
                "status": "fully_activated",
                "message": "Account fully activated! You can now create listings",
                "can_create_listings": True
            },
            ActivationStatus.REJECTED: {
                "status": "rejected",
                "message": f"Request rejected: {activation_request.rejection_reason}",
                "can_create_listings": False
            }
        }
        
        result = status_map.get(activation_request.status, {
            "status": "unknown",
            "message": "Unknown status",
            "can_create_listings": False
        })
        
        result["is_activated"] = activation_request.status == ActivationStatus.FULLY_ACTIVATED
        return result
        
    except Exception as e:
        print(f"Error getting status: {e}")
        return {"is_activated": False, "status": "error", "message": str(e), "can_create_listings": False}


# ============ ADMIN: GET PENDING DOCUMENT REQUESTS ============
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
                "status": "documents_pending"
            })
        
        return result
        
    except Exception as e:
        print(f"Error: {e}")
        return []


# ============ ADMIN: GET PENDING PAYMENT REQUESTS ============
@router.get("/admin/pending-payments")
async def get_pending_payment_requests(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        requests = db.query(ActivationRequest).filter(
            ActivationRequest.status == ActivationStatus.PAYMENT_PENDING
        ).order_by(ActivationRequest.created_at.desc()).all()
        
        result = []
        for req in requests:
            result.append({
                "id": req.id,
                "user_id": req.user_id,
                "full_name": req.full_name,
                "email": req.email,
                "phone_number": req.phone_number,
                "plan_type": req.plan_type,
                "payment_amount": req.payment_amount,
                "payment_receipt": req.payment_receipt,
                "created_at": req.created_at.isoformat() if req.created_at else None,
                "status": "payment_pending"
            })
        
        return result
        
    except Exception as e:
        print(f"Error: {e}")
        return []


# ============ ADMIN: GET ALL PAYMENTS ============
@router.get("/admin/payments")
async def get_all_payments(
    status: str = "all",
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(ActivationRequest)
        
        if status == "pending":
            query = query.filter(ActivationRequest.status == ActivationStatus.PAYMENT_PENDING)
        elif status == "approved":
            query = query.filter(ActivationRequest.status == ActivationStatus.FULLY_ACTIVATED)
        elif status == "rejected":
            query = query.filter(ActivationRequest.status == ActivationStatus.REJECTED)
        
        requests = query.order_by(ActivationRequest.created_at.desc()).all()
        
        result = []
        for req in requests:
            # Get user info
            user = db.query(User).filter(User.id == req.user_id).first()
            
            result.append({
                "id": req.id,
                "user_id": req.user_id,
                "full_name": req.full_name,
                "email": req.email,
                "phone_number": req.phone_number,
                "plan_type": req.plan_type,
                "payment_amount": req.payment_amount,
                "payment_receipt": req.payment_receipt,
                "payment_transaction_id": req.payment_transaction_id,
                "status": req.status.value if req.status else "pending",
                "rejection_reason": req.rejection_reason,
                "created_at": req.created_at.isoformat() if req.created_at else None,
                "user_name": user.full_name if user else req.full_name,
                "user_email": user.email if user else req.email
            })
        
        return result
        
    except Exception as e:
        print(f"Error: {e}")
        return []


# ============ ADMIN: APPROVE DOCUMENTS ============
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


# ============ USER: SUBMIT PAYMENT ============
@router.post("/submit-payment")
async def submit_payment(
    payment_data: PaymentSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        activation_request = db.query(ActivationRequest).filter(
            ActivationRequest.user_id == current_user.id,
            ActivationRequest.status == ActivationStatus.DOCUMENTS_APPROVED
        ).first()
        
        if not activation_request:
            raise HTTPException(status_code=400, detail="No approved document request found")
        
        activation_request.status = ActivationStatus.PAYMENT_PENDING
        activation_request.plan_type = payment_data.plan_type
        activation_request.payment_amount = payment_data.amount
        activation_request.payment_receipt = payment_data.receipt_url
        activation_request.payment_transaction_id = payment_data.transaction_id
        
        db.commit()
        
        return {"success": True, "message": "Payment submitted for admin verification"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ ADMIN: APPROVE PAYMENT ============
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
        
        # Update user to fully activated
        user = db.query(User).filter(User.id == activation_request.user_id).first()
        if user:
            user.is_activated = True
            user.payment_approved = True
            user.can_create_listings = True
            user.has_active_subscription = True
            user.subscription_plan = activation_request.plan_type
            user.subscription_start_date = datetime.utcnow()
            user.activated_at = datetime.utcnow()
            user.status = "active"
            
            # Set role based on plan
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
        
        return {"success": True, "message": "Payment approved! Account fully activated"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ ADMIN: REJECT PAYMENT ============
@router.post("/admin/reject-payment/{request_id}")
async def reject_payment(
    request_id: int,
    rejection_data: RejectRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        activation_request = db.query(ActivationRequest).filter(
            ActivationRequest.id == request_id
        ).first()
        
        if not activation_request:
            raise HTTPException(status_code=404, detail="Activation request not found")
        
        if activation_request.status not in [ActivationStatus.PAYMENT_PENDING, ActivationStatus.DOCUMENTS_PENDING]:
            raise HTTPException(status_code=400, detail="This request cannot be rejected")
        
        activation_request.status = ActivationStatus.REJECTED
        activation_request.rejection_reason = rejection_data.rejection_reason
        activation_request.reviewed_by = current_user.id
        activation_request.reviewed_at = datetime.utcnow()
        
        db.commit()
        
        return {"success": True, "message": "Request rejected"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ ADMIN: GET COUNTS ============
@router.get("/admin/counts")
async def get_activation_counts(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        pending_documents = db.query(ActivationRequest).filter(
            ActivationRequest.status == ActivationStatus.DOCUMENTS_PENDING
        ).count()
        
        pending_payments = db.query(ActivationRequest).filter(
            ActivationRequest.status == ActivationStatus.PAYMENT_PENDING
        ).count()
        
        approved = db.query(ActivationRequest).filter(
            ActivationRequest.status == ActivationStatus.FULLY_ACTIVATED
        ).count()
        
        rejected = db.query(ActivationRequest).filter(
            ActivationRequest.status == ActivationStatus.REJECTED
        ).count()
        
        return {
            "pending_documents": pending_documents,
            "pending_payments": pending_payments,
            "approved": approved,
            "rejected": rejected
        }
        
    except Exception as e:
        print(f"Error: {e}")
        return {"pending_documents": 0, "pending_payments": 0, "approved": 0, "rejected": 0}


# ============ GET USER STATUS (FOR SIDEBAR) ============
@router.get("/user-status")
async def get_user_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's activation status for sidebar display"""
    try:
        # Check if fully activated
        if current_user.can_create_listings and current_user.is_activated and current_user.payment_approved:
            return {"status": "active", "message": "Account fully activated"}
        
        # Check if payment is pending
        activation_request = db.query(ActivationRequest).filter(
            ActivationRequest.user_id == current_user.id,
            ActivationRequest.status == ActivationStatus.PAYMENT_PENDING
        ).first()
        
        if activation_request:
            return {"status": "pending", "message": "Payment under review"}
        
        # Check if documents are approved
        activation_request = db.query(ActivationRequest).filter(
            ActivationRequest.user_id == current_user.id,
            ActivationRequest.status == ActivationStatus.DOCUMENTS_APPROVED
        ).first()
        
        if activation_request:
            return {"status": "pending", "message": "Documents approved. Please subscribe"}
        
        # Check if documents are pending
        activation_request = db.query(ActivationRequest).filter(
            ActivationRequest.user_id == current_user.id,
            ActivationRequest.status == ActivationStatus.DOCUMENTS_PENDING
        ).first()
        
        if activation_request:
            return {"status": "pending", "message": "Documents under review"}
        
        return {"status": "pending", "message": "Activation not started"}
        
    except Exception as e:
        print(f"Error getting user status: {e}")
        return {"status": "pending", "message": "Unknown status"}


# ============ GET PENDING COUNT (for sidebar badge) ============
@router.get("/pending-count")
async def get_pending_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role_type == "admin":
            count = db.query(ActivationRequest).filter(
                ActivationRequest.status == ActivationStatus.DOCUMENTS_PENDING
            ).count()
            return {"count": count}
        else:
            return {"count": 0}
    except Exception as e:
        print(f"Error: {e}")
        return {"count": 0}