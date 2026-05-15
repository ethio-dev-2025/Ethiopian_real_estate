from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from enum import Enum

class PropertyType(str, Enum):
    APARTMENT = "Apartment"
    HOUSE = "House"
    CONDO = "Condo"
    VILLA = "Villa"
    TOWNHOUSE = "Townhouse"
    LAND = "Land"

class ListingStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    SOLD = "sold"

class ListingBase(BaseModel):
    title: str
    description: str
    price: float
    listing_type: str
    property_type: str
    bedrooms: Optional[int] = 0
    bathrooms: Optional[float] = 0.0
    sqft: Optional[int] = 0
    year_built: Optional[int] = None
    address: str
    city: str
    region: str
    sub_city: Optional[str] = None
    kebele: Optional[str] = None
    images: List[str] = []
    videos: List[str] = []
    documents: List[str] = []
    amenities: List[str] = []

class ListingCreate(ListingBase):
    pass

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    property_type: Optional[PropertyType] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    sqft: Optional[int] = None
    year_built: Optional[int] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    images: Optional[List[str]] = None
    amenities: Optional[List[str]] = None
    status: Optional[ListingStatus] = None

class Listing(ListingBase):
    id: int
    status: ListingStatus
    views_count: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
