# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}
    
    # ========== PRIMARY ID ==========
    id = Column(Integer, primary_key=True, index=True)
    
    # ========== AUTHENTICATION FIELDS ==========
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    
    # ========== CONTACT INFORMATION ==========
    phone = Column(String(20), nullable=True)
    city = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)
    address = Column(String(255), nullable=True)
    
    # ========== ADDITIONAL PROFILE FIELDS ==========
    date_of_birth = Column(String(50), nullable=True)
    bio = Column(Text, nullable=True)
    
    # ========== PROFESSIONAL FIELDS ==========
    company = Column(String(255), nullable=True)
    license_number = Column(String(100), nullable=True)
    experience = Column(String(50), nullable=True)
    
    # ========== SOCIAL MEDIA FIELDS ==========
    website = Column(String(500), nullable=True)
    facebook = Column(String(500), nullable=True)
    instagram = Column(String(500), nullable=True)
    linkedin = Column(String(500), nullable=True)
    
    # ========== NOTIFICATION SETTINGS ==========
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    
    # ========== PRIVACY SETTINGS ==========
    profile_visibility = Column(String(20), default="public")
    email_visibility = Column(String(20), default="private")
    phone_visibility = Column(String(20), default="private")
    
    # ========== DOCUMENT SUBMISSION TRACKING ==========
    seller_documents_submitted = Column(Boolean, default=False)
    landlord_documents_submitted = Column(Boolean, default=False)
    
    # ========== ROLE AND STATUS ==========
    role_type = Column(String(50), default="buyer")
    status = Column(String(50), default="pending")
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # ========== ACTIVATION FIELDS ==========
    is_activated = Column(Boolean, default=False)
    activation_request_id = Column(Integer, nullable=True)
    activated_at = Column(DateTime(timezone=True), nullable=True)
    
    # ========== SUBSCRIPTION FIELDS ==========
    has_active_subscription = Column(Boolean, default=False)
    subscription_plan = Column(String(50), default="free")
    subscription_start_date = Column(DateTime(timezone=True), nullable=True)
    subscription_end_date = Column(DateTime(timezone=True), nullable=True)
    payment_status = Column(String(50), default="pending")
    
    # ========== PAYMENT APPROVAL FIELDS ==========
    payment_approved = Column(Boolean, default=False)
    can_create_listings = Column(Boolean, default=False)
    
    # ========== SELLER FIELDS ==========
    seller_enabled = Column(Boolean, default=False)
    seller_approved = Column(Boolean, default=False)
    seller_paid = Column(Boolean, default=False)
    
    # ========== LANDLORD FIELDS ==========
    landlord_enabled = Column(Boolean, default=False)
    landlord_approved = Column(Boolean, default=False)
    landlord_paid = Column(Boolean, default=False)
    
    # ========== AVATAR / PROFILE PICTURE ==========
    avatar_url = Column(String(500), nullable=True)
    
    # ========== TIMESTAMPS ==========
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # ========== RELATIONSHIPS ==========
    listings = relationship("Listing", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.email}>"
    
    def to_dict(self):
        """Convert user object to dictionary"""
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "full_name": self.full_name,
            "phone": self.phone,
            "city": self.city,
            "region": self.region,
            "address": self.address,
            "date_of_birth": self.date_of_birth,
            "bio": self.bio,
            "company": self.company,
            "license_number": self.license_number,
            "experience": self.experience,
            "website": self.website,
            "facebook": self.facebook,
            "instagram": self.instagram,
            "linkedin": self.linkedin,
            "email_notifications": self.email_notifications,
            "push_notifications": self.push_notifications,
            "profile_visibility": self.profile_visibility,
            "email_visibility": self.email_visibility,
            "phone_visibility": self.phone_visibility,
            "role_type": self.role_type,
            "status": self.status,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "is_activated": self.is_activated,
            "has_active_subscription": self.has_active_subscription,
            "subscription_plan": self.subscription_plan,
            "avatar_url": self.avatar_url,
            "payment_approved": self.payment_approved,
            "can_create_listings": self.can_create_listings,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None
        }