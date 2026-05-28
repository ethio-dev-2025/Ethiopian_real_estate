# backend/app/models/listing.py
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
    
    # ============ MAP COORDINATES - ADD THESE ============
    latitude = Column(Float, nullable=True)   # For map markers
    longitude = Column(Float, nullable=True)  # For map markers
    
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
    
    def to_dict(self):
        import json
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "price": self.price,
            "listing_type": self.listing_type,
            "property_type": self.property_type,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "sqft": self.sqft,
            "year_built": self.year_built,
            "status": self.status,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "address": self.address,
            "city": self.city,
            "region": self.region,
            "sub_city": self.sub_city,
            "kebele": self.kebele,
            "images": json.loads(self.images) if self.images else [],
            "cover_image": self.cover_image,
            "amenities": json.loads(self.amenities) if self.amenities else [],
            "phone_number": self.phone_number,
            "email": self.email,
            "views_count": self.views_count,
            "featured": self.featured,
            "is_draft": self.is_draft,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "published_at": self.published_at.isoformat() if self.published_at else None,
        }