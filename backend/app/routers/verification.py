from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import uuid
from ..database import get_db
from ..models import User, VerificationDocument
from .auth import get_current_user

router = APIRouter()

@router.post("/upload-document")
async def upload_document(
    role_type: str = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    upload_dir = f"uploads/documents/user_{current_user.id}"
    os.makedirs(upload_dir, exist_ok=True)
    file_extension = file.filename.split('.')[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"{upload_dir}/{unique_filename}"
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    new_document = VerificationDocument(
        user_id=current_user.id,
        user_name=current_user.full_name or current_user.username,
        role_type=role_type,
        document_type=document_type,
        document_url=file_path,
        document_name=file.filename,
        status="pending"
    )
    
    db.add(new_document)
    
    if role_type == "seller":
        current_user.seller_documents_submitted = True
    elif role_type == "landlord":
        current_user.landlord_documents_submitted = True
    
    db.commit()
    db.refresh(new_document)
    
    return {
        "success": True,
        "message": "Document uploaded successfully",
        "document_id": new_document.id
    }

@router.get("/my-documents")
async def get_my_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    documents = db.query(VerificationDocument).filter(
        VerificationDocument.user_id == current_user.id
    ).order_by(VerificationDocument.created_at.desc()).all()
    
    return [
        {
            "id": doc.id,
            "document_name": doc.document_name,
            "document_type": doc.document_type,
            "role_type": doc.role_type,
            "status": doc.status,
            "rejection_reason": doc.rejection_reason,
            "created_at": doc.created_at.isoformat()
        }
        for doc in documents
    ]

@router.get("/status")
async def get_verification_status(
    current_user: User = Depends(get_current_user)
):
    return {
        "seller_approved": current_user.seller_approved,
        "seller_documents_submitted": current_user.seller_documents_submitted,
        "seller_paid": current_user.seller_paid,
        "landlord_approved": current_user.landlord_approved,
        "landlord_documents_submitted": current_user.landlord_documents_submitted,
        "landlord_paid": current_user.landlord_paid
    }