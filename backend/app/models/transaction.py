# backend/app/models/transaction.py
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Property details
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Parties involved
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Transaction details
    transaction_type = Column(String(20), nullable=False)  # 'sale' or 'rent'
    amount = Column(Float, nullable=False)
    status = Column(String(50), default="completed")
    
    # For rent only
    rental_duration_months = Column(Integer, nullable=True)
    rental_start_date = Column(DateTime(timezone=True), nullable=True)
    rental_end_date = Column(DateTime(timezone=True), nullable=True)
    
    # Payment tracking
    payment_reference = Column(String(255), nullable=True)
    payment_method = Column(String(50), default="chapa")
    contract_url = Column(String(500), nullable=True)
    
    # Timestamps
    transaction_date = Column(DateTime(timezone=True), server_default=func.now())
    completed_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # ============ RELATIONSHIPS - FIXED (removed the problematic backref) ============
    # No direct relationship to Listing here - will use the one in Listing model
    
    def to_dict(self):
        return {
            "id": self.id,
            "listing_id": self.listing_id,
            "seller_id": self.seller_id,
            "buyer_id": self.buyer_id,
            "transaction_type": self.transaction_type,
            "amount": self.amount,
            "status": self.status,
            "rental_duration_months": self.rental_duration_months,
            "rental_start_date": self.rental_start_date.isoformat() if self.rental_start_date else None,
            "rental_end_date": self.rental_end_date.isoformat() if self.rental_end_date else None,
            "payment_reference": self.payment_reference,
            "payment_method": self.payment_method,
            "contract_url": self.contract_url,
            "transaction_date": self.transaction_date.isoformat() if self.transaction_date else None,
            "completed_date": self.completed_date.isoformat() if self.completed_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }