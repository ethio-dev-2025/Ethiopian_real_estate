from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..database import get_db
from ..models import User, Subscription
from .auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class SubscriptionCreate(BaseModel):
    subscription_type: str
    payment_method: str = "card"
    amount: float

@router.post("/create")
async def create_subscription(
    sub_data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if sub_data.subscription_type in ["selling", "both"] and not current_user.seller_approved:
        raise HTTPException(status_code=400, detail="Seller verification not approved")
    
    if sub_data.subscription_type in ["renting", "both"] and not current_user.landlord_approved:
        raise HTTPException(status_code=400, detail="Landlord verification not approved")
    
    subscription = Subscription(
        user_id=current_user.id,
        user_name=current_user.full_name or current_user.username,
        plan_name=sub_data.subscription_type,
        amount=sub_data.amount,
        status="success",
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=30)
    )
    
    db.add(subscription)
    
    if sub_data.subscription_type in ["selling", "both"]:
        current_user.seller_paid = True
        current_user.seller_enabled = True
        current_user.seller_activation_date = datetime.utcnow()
        current_user.seller_expiry_date = datetime.utcnow() + timedelta(days=30)
    
    if sub_data.subscription_type in ["renting", "both"]:
        current_user.landlord_paid = True
        current_user.landlord_enabled = True
        current_user.landlord_activation_date = datetime.utcnow()
        current_user.landlord_expiry_date = datetime.utcnow() + timedelta(days=30)
    
    if sub_data.subscription_type == "both":
        current_user.role_type = "dual"
    elif sub_data.subscription_type == "selling":
        if current_user.role_type == "landlord":
            current_user.role_type = "dual"
        else:
            current_user.role_type = "seller"
    elif sub_data.subscription_type == "renting":
        if current_user.role_type == "seller":
            current_user.role_type = "dual"
        else:
            current_user.role_type = "landlord"
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Subscription activated for {sub_data.subscription_type}",
        "subscription_id": subscription.id
    }

@router.get("/my-subscription")
async def get_my_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == "success"
    ).order_by(Subscription.created_at.desc()).first()
    
    if not subscription:
        return {"has_subscription": False}
    
    return {
        "has_subscription": True,
        "plan_name": subscription.plan_name,
        "amount": subscription.amount,
        "start_date": subscription.start_date.isoformat() if subscription.start_date else None,
        "end_date": subscription.end_date.isoformat() if subscription.end_date else None,
        "is_active": subscription.end_date and subscription.end_date > datetime.utcnow()
    }