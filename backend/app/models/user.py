# backend/app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    
    # Profile fields
    avatar_url = Column(String(500), nullable=True)
    date_of_birth = Column(String(50), nullable=True)
    city = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)
    address = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    position = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    
    # Role and status
    role_type = Column(String(50), default="buyer")  # buyer, seller, landlord, dual, admin
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_activated = Column(Boolean, default=False)
    status = Column(String(50), default="pending")
    
    # Payment and subscription - UPDATED FOR 6-MONTH SUBSCRIPTION
    payment_approved = Column(Boolean, default=False)
    payment_status = Column(String(50), default="pending")
    can_create_listings = Column(Boolean, default=False)
    has_active_subscription = Column(Boolean, default=False)
    subscription_plan = Column(String(50), nullable=True)  # seller, landlord, dual
    subscription_start_date = Column(DateTime(timezone=True), nullable=True)
    subscription_end_date = Column(DateTime(timezone=True), nullable=True)
    
    # Seller specific
    seller_enabled = Column(Boolean, default=False)
    seller_approved = Column(Boolean, default=False)
    seller_paid = Column(Boolean, default=False)
    
    # Landlord specific
    landlord_enabled = Column(Boolean, default=False)
    landlord_approved = Column(Boolean, default=False)
    landlord_paid = Column(Boolean, default=False)
    
    # Notification preferences
    email_alerts = Column(Boolean, default=True)
    new_user_notifications = Column(Boolean, default=True)
    payment_notifications = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    listings = relationship("Listing", foreign_keys="Listing.user_id", back_populates="user")
    purchased_listings = relationship("Listing", foreign_keys="Listing.sold_to_user_id", back_populates="sold_to_user")
    
    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "full_name": self.full_name,
            "phone": self.phone,
            "avatar_url": self.avatar_url,
            "role_type": self.role_type,
            "is_activated": self.is_activated,
            "is_verified": self.is_verified,
            "can_create_listings": self.can_create_listings,
            "payment_approved": self.payment_approved,
            "payment_status": self.payment_status,
            "has_active_subscription": self.has_active_subscription,
            "subscription_plan": self.subscription_plan,
            "subscription_start_date": self.subscription_start_date.isoformat() if self.subscription_start_date else None,
            "subscription_end_date": self.subscription_end_date.isoformat() if self.subscription_end_date else None,
            "city": self.city,
            "region": self.region,
            "address": self.address,
            "bio": self.bio,
            "position": self.position,
            "department": self.department,
            "date_of_birth": self.date_of_birth,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }