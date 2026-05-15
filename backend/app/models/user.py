from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    
    # Contact Information
    phone = Column(String(20), nullable=True)
    city = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)
    address = Column(String(255), nullable=True)
    
    # Role and Status
    role_type = Column(String(50), default="buyer")
    status = Column(String(50), default="pending")
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Activation fields
    is_activated = Column(Boolean, default=False)
    activation_request_id = Column(Integer, nullable=True)
    activated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Subscription fields - ADD THESE LINES
    has_active_subscription = Column(Boolean, default=False)
    subscription_plan = Column(String(50), default="free")
    subscription_start_date = Column(DateTime(timezone=True), nullable=True)
    subscription_end_date = Column(DateTime(timezone=True), nullable=True)
    payment_status = Column(String(50), default="pending")
    
    # Seller fields
    seller_enabled = Column(Boolean, default=False)
    seller_approved = Column(Boolean, default=False)
    seller_paid = Column(Boolean, default=False)
    
    # Landlord fields
    landlord_enabled = Column(Boolean, default=False)
    landlord_approved = Column(Boolean, default=False)
    landlord_paid = Column(Boolean, default=False)
    
    # Avatar
    avatar_url = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationship
    listings = relationship("Listing", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.email}>"