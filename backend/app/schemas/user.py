# backend/app/schemas/user.py
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
import re

def is_gmail_email(email: str) -> bool:
    if not email:
        return False
    email_lower = email.lower().strip()
    allowed_domains = ['gmail.com', 'googlemail.com']
    for domain in allowed_domains:
        if email_lower.endswith(f'@{domain}'):
            return True
    return False

class UserCreate(BaseModel):
    email: Optional[EmailStr] = None
    username: str
    password: str
    full_name: str
    phone: Optional[str] = None
    company: Optional[str] = None
    role: str = "seller"
    
    @field_validator('email')
    def validate_email(cls, v, info):
        role = info.data.get('role', 'seller')
        
        # For buyers, email is optional
        if role == 'buyer':
            return v
        
        # For sellers/landlords/dual - Gmail required
        if not v:
            raise ValueError('Email is required for sellers/landlords')
        
        if not is_gmail_email(v):
            raise ValueError('Email must be a Gmail address (username@gmail.com)')
        
        return v

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    phone: Optional[str]
    company: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse