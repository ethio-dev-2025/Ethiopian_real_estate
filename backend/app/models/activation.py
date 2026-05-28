from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Float, Index
from sqlalchemy.sql import func
from ..database import Base
import enum

class ActivationStatus(str, enum.Enum):
    DOCUMENTS_PENDING = "documents_pending"
    DOCUMENTS_APPROVED = "documents_approved"
    PAYMENT_PENDING = "payment_pending"
    FULLY_ACTIVATED = "fully_activated"
    REJECTED = "rejected"

class ActivationRequest(Base):
    __tablename__ = "activation_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Personal Information
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=False)
    
    # Property Information
    property_address = Column(String(500), nullable=False)
    property_type = Column(String(100), nullable=False)
    ownership_document = Column(String(500), nullable=True)
    title_deed = Column(String(500), nullable=True)
    tax_clearance = Column(String(500), nullable=True)
    property_photos = Column(Text, nullable=True)
    
    # Business Information
    business_name = Column(String(255), nullable=True)
    business_license = Column(String(500), nullable=True)
    tax_id = Column(String(100), nullable=True)
    government_id = Column(String(500), nullable=True)
    
    # Additional Info
    experience_years = Column(Integer, default=0)
    previous_listings_count = Column(Integer, default=0)
    reason_for_activation = Column(Text, nullable=True)
    
    # ========== PAYMENT FIELDS ==========
    plan_type = Column(String(50), nullable=True)
    payment_amount = Column(Float, nullable=True)
    payment_receipt = Column(String(500), nullable=True)
    payment_transaction_id = Column(String(255), nullable=True)
    payment_approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    payment_approved_at = Column(DateTime(timezone=True), nullable=True)
    
    # ========== STATUS FIELDS - CHANGE FROM Enum TO String ==========
    status = Column(String(50), default="documents_pending")  # Changed from Enum to String
    rejection_reason = Column(Text, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Add indexes for faster queries
    __table_args__ = (
        Index('idx_status_created', 'status', 'created_at'),
        Index('idx_user_status', 'user_id', 'status'),
    )