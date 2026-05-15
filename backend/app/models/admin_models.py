from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.sql import func
from ..database import Base

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    contact_email = Column(String(255), nullable=True)  # Alternative contact
    address = Column(Text, nullable=True)
    logo = Column(String(500), nullable=True)
    website = Column(String(255), nullable=True)
    tax_id = Column(String(100), nullable=True)
    portfolio_type = Column(String(100), nullable=True)  # Type of portfolio
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_type = Column(String(50), nullable=False)  # basic, premium, business
    plan = Column(String(50), nullable=True)  # Alternative name
    amount = Column(Float, nullable=False)
    status = Column(String(50), default="active")  # active, expired, cancelled
    start_date = Column(DateTime(timezone=True), server_default=func.now())
    end_date = Column(DateTime(timezone=True), nullable=True)
    payment_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class VerificationDocument(Base):
    __tablename__ = "verification_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_type = Column(String(100), nullable=False)  # business_license, id_card, ownership_document, etc.
    document_url = Column(String(500), nullable=False)
    status = Column(String(50), default="pending")  # pending, approved, rejected
    rejection_reason = Column(Text, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class AdminActivity(Base):
    __tablename__ = "admin_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)  # e.g., 'verify_user', 'suspend_user', 'approve_listing'
    target_type = Column(String(50), nullable=True)  # e.g., 'user', 'listing', 'payment'
    target_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())