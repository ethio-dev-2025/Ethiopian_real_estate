from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Listing(Base):
    __tablename__ = "listings"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    listing_type = Column(String(50), default="sale")
    property_type = Column(String(50), default="house")
    bedrooms = Column(Integer, default=0)
    bathrooms = Column(Integer, default=0)
    sqft = Column(Float, default=0)
    year_built = Column(Integer, nullable=True)
    status = Column(String(50), default="draft")
    
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)
    sub_city = Column(String(100), nullable=True)
    kebele = Column(String(100), nullable=True)
    zip_code = Column(String(20), nullable=True)
    
    images = Column(Text, nullable=True)
    cover_image = Column(String(500), nullable=True)
    videos = Column(Text, nullable=True)
    documents = Column(Text, nullable=True)
    amenities = Column(Text, nullable=True)
    
    # Contact fields
    phone_number = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    
    views_count = Column(Integer, default=0)
    featured = Column(Boolean, default=False)
    is_draft = Column(Boolean, default=True)
    
    # Foreign key - Use user_id
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    published_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationship - Use 'user'
    user = relationship("User", back_populates="listings")