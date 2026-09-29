from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PropertyCreate(BaseModel):
    title: str
    description: str
    property_type: str
    price: float
    area: float
    bedrooms: int = 0
    bathrooms: int = 0
    location: str
    city: str
    region: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    features: Optional[str] = None

class PropertyResponse(BaseModel):
    id: int
    title: str
    description: str
    property_type: str
    status: str
    price: float
    area: float
    bedrooms: int
    bathrooms: int
    location: str
    city: str
    region: str
    latitude: Optional[float]
    longitude: Optional[float]
    images: Optional[str]
    is_featured: bool
    is_verified: bool
    views_count: int
    owner_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
