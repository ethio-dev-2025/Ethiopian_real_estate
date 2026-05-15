from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, Enum
from sqlalchemy.sql import func
from ..database import Base
import enum

class DocumentType(str, enum.Enum):
    OWNERSHIP_DEED = "ownership_deed"
    TAX_CERTIFICATE = "tax_certificate"
    GOVERNMENT_ID = "government_id"
    BANK_DETAILS = "bank_details"
    SALE_AGREEMENT = "sale_agreement"
    LOCAL_CLEARANCE = "local_clearance"
    TITLE_DEED = "title_deed"
    RENTAL_AGREEMENT = "rental_agreement"
    UTILITY_CLEARANCE = "utility_clearance"
    SPOUSE_CONSENT = "spouse_consent"

class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    NEEDS_REVISION = "needs_revision"

class RoleDocument(Base):
    __tablename__ = "role_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_type = Column(String(50), nullable=False)
    document_type = Column(Enum(DocumentType), nullable=False)
    document_url = Column(Text, nullable=False)
    document_name = Column(String(255), nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.PENDING)
    rejection_reason = Column(Text, nullable=True)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class RoleSubscription(Base):
    __tablename__ = "role_subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_type = Column(String(50), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(50), default="pending")
    payment_id = Column(String(255), nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())