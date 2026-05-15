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


# ============ TEST ENDPOINT - ALWAYS WORKS ============
@router.get("/test")
async def test_endpoint():
    """Simple test endpoint to verify router is working"""
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
        existing_request = db.query(ActivationRequest).filter(
            ActivationRequest.user_id == current_user.id,
            ActivationRequest.status == ActivationStatus.PENDING
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
            status=ActivationStatus.PENDING,
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
        if current_user.is_activated:
            return {"is_activated": True, "status": "activated"}
        
        pending = db.query(ActivationRequest).filter(
            ActivationRequest.user_id == current_user.id,
            ActivationRequest.status == ActivationStatus.PENDING
        ).first()
        
        if pending:
            return {"is_activated": False, "status": "pending"}
        
        rejected = db.query(ActivationRequest).filter(
            ActivationRequest.user_id == current_user.id,
            ActivationRequest.status == ActivationStatus.REJECTED
        ).first()
        
        if rejected:
            return {"is_activated": False, "status": "rejected", "rejection_reason": rejected.rejection_reason}
        
        return {"is_activated": False, "status": "not_submitted"}
        
    except Exception as e:
        print(f"Error: {e}")
        return {"is_activated": False, "status": "not_submitted"}


# ============ ADMIN: GET PENDING REQUESTS ============
@router.get("/admin/pending-requests")
async def get_pending_activation_requests(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        print(f"=== DEBUG: Admin user {current_user.email} fetching pending requests ===")
        
        requests = db.query(ActivationRequest).filter(
            ActivationRequest.status == ActivationStatus.PENDING
        ).order_by(
            ActivationRequest.created_at.desc()
        ).all()
        
        print(f"Found {len(requests)} pending requests")
        
        result = []
        for req in requests:
            property_photos = req.property_photos
            if property_photos and isinstance(property_photos, str):
                try:
                    property_photos = json.loads(property_photos)
                except:
                    property_photos = []
            
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
                "property_photos": property_photos,
                "created_at": req.created_at.isoformat() if req.created_at else None,
                "status": "pending"
            })
        
        return result
        
    except Exception as e:
        print(f"Error in pending-requests: {e}")
        import traceback
        traceback.print_exc()
        # Return empty list instead of error
        return []


# ============ ADMIN: GET APPROVED REQUESTS ============
@router.get("/admin/approved-requests")
async def get_approved_activation_requests(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        requests = db.query(ActivationRequest).filter(
            ActivationRequest.status == ActivationStatus.APPROVED
        ).order_by(
            ActivationRequest.created_at.desc()
        ).all()
        
        result = []
        for req in requests:
            property_photos = req.property_photos
            if property_photos and isinstance(property_photos, str):
                try:
                    property_photos = json.loads(property_photos)
                except:
                    property_photos = []
            
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
                "property_photos": property_photos,
                "created_at": req.created_at.isoformat() if req.created_at else None,
                "status": "approved"
            })
        
        return result
        
    except Exception as e:
        print(f"Error in approved-requests: {e}")
        return []


# ============ ADMIN: GET REJECTED REQUESTS ============
@router.get("/admin/rejected-requests")
async def get_rejected_activation_requests(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        requests = db.query(ActivationRequest).filter(
            ActivationRequest.status == ActivationStatus.REJECTED
        ).order_by(
            ActivationRequest.created_at.desc()
        ).all()
        
        result = []
        for req in requests:
            property_photos = req.property_photos
            if property_photos and isinstance(property_photos, str):
                try:
                    property_photos = json.loads(property_photos)
                except:
                    property_photos = []
            
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
                "property_photos": property_photos,
                "created_at": req.created_at.isoformat() if req.created_at else None,
                "status": "rejected",
                "rejection_reason": req.rejection_reason
            })
        
        return result
        
    except Exception as e:
        print(f"Error in rejected-requests: {e}")
        return []


# ============ ADMIN: GET ALL REQUESTS ============
@router.get("/admin/all-requests")
async def get_all_activation_requests(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        requests = db.query(ActivationRequest).order_by(
            ActivationRequest.created_at.desc()
        ).all()
        
        result = []
        for req in requests:
            property_photos = req.property_photos
            if property_photos and isinstance(property_photos, str):
                try:
                    property_photos = json.loads(property_photos)
                except:
                    property_photos = []
            
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
                "property_photos": property_photos,
                "created_at": req.created_at.isoformat() if req.created_at else None,
                "status": req.status.value if req.status else "pending",
                "rejection_reason": req.rejection_reason
            })
        
        return result
        
    except Exception as e:
        print(f"Error in all-requests: {e}")
        return []


# ============ ADMIN: GET COUNTS ============
@router.get("/admin/counts")
async def get_activation_counts(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        pending_count = db.query(ActivationRequest).filter(
            ActivationRequest.status == ActivationStatus.PENDING
        ).count()
        
        approved_count = db.query(ActivationRequest).filter(
            ActivationRequest.status == ActivationStatus.APPROVED
        ).count()
        
        rejected_count = db.query(ActivationRequest).filter(
            ActivationRequest.status == ActivationStatus.REJECTED
        ).count()
        
        return {
            "pending": pending_count,
            "approved": approved_count,
            "rejected": rejected_count,
            "all": pending_count + approved_count + rejected_count
        }
        
    except Exception as e:
        print(f"Error getting counts: {e}")
        return {"pending": 0, "approved": 0, "rejected": 0, "all": 0}


# ============ ADMIN: APPROVE REQUEST ============
@router.post("/admin/approve/{request_id}")
async def approve_activation_request(
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
        
        if activation_request.status != ActivationStatus.PENDING:
            raise HTTPException(status_code=400, detail="This request has already been processed")
        
        activation_request.status = ActivationStatus.APPROVED
        activation_request.reviewed_by = current_user.id
        activation_request.reviewed_at = datetime.utcnow()
        
        user = db.query(User).filter(User.id == activation_request.user_id).first()
        if user:
            user.is_activated = True
            user.activated_at = datetime.utcnow()
        
        db.commit()
        
        return {"success": True, "message": "Activation request approved successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error approving request: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ ADMIN: REJECT REQUEST ============
@router.post("/admin/reject/{request_id}")
async def reject_activation_request(
    request_id: int,
    rejection_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        activation_request = db.query(ActivationRequest).filter(
            ActivationRequest.id == request_id
        ).first()
        
        if not activation_request:
            raise HTTPException(status_code=404, detail="Activation request not found")
        
        if activation_request.status != ActivationStatus.PENDING:
            raise HTTPException(status_code=400, detail="This request has already been processed")
        
        rejection_reason = rejection_data.get("rejection_reason", "No reason provided")
        
        activation_request.status = ActivationStatus.REJECTED
        activation_request.rejection_reason = rejection_reason
        activation_request.reviewed_by = current_user.id
        activation_request.reviewed_at = datetime.utcnow()
        
        db.commit()
        
        return {"success": True, "message": "Activation request rejected"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error rejecting request: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ GET PENDING COUNT (for sidebar badge) ============
@router.get("/pending-count")
async def get_pending_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of pending activation requests for admin badge"""
    try:
        if current_user.role_type == "admin":
            count = db.query(ActivationRequest).filter(
                ActivationRequest.status == ActivationStatus.PENDING
            ).count()
            return {"count": count}
        else:
            return {"count": 0}
    except Exception as e:
        print(f"Error getting pending count: {e}")
        return {"count": 0}