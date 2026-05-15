from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class SystemSettings(Base):
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    site_name = Column(String(255), default="RealEstate Pro")
    admin_email = Column(String(255), default="admin@realestatepro.com")
    support_email = Column(String(255), default="support@realestatepro.com")
    contact_phone = Column(String(50), default="+251 11 123 4567")
    timezone = Column(String(100), default="Africa/Addis_Ababa")
    currency = Column(String(10), default="ETB")
    language = Column(String(10), default="en")
    meta = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class UserSettings(Base):
    __tablename__ = "user_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, nullable=False)
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    message_alerts = Column(Boolean, default=True)
    listing_alerts = Column(Boolean, default=True)
    payment_alerts = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())