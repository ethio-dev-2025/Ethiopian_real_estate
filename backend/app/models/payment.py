# backend/app/models/payment.py
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Transaction details
    tx_ref = Column(String(255), unique=True, index=True, nullable=False)
    transaction_id = Column(String(255), nullable=True)
    plan_type = Column(String(50), nullable=False)  # seller, landlord, dual
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="ETB")
    
    # Status tracking
    status = Column(String(50), default="pending")  # pending, approved, rejected
    payment_status = Column(String(50), default="initiated")  # initiated, completed, failed
    
    # Admin review
    reviewed_by = Column(Integer, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Receipt
    receipt_url = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<PaymentTransaction {self.id}: {self.user_id} - {self.plan_type} - {self.status}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "tx_ref": self.tx_ref,
            "transaction_id": self.transaction_id,
            "plan_type": self.plan_type,
            "amount": self.amount,
            "currency": self.currency,
            "status": self.status,
            "payment_status": self.payment_status,
            "rejection_reason": self.rejection_reason,
            "receipt_url": self.receipt_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }