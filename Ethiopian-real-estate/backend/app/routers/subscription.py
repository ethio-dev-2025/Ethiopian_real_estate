# backend/app/routers/subscription.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..database import get_db
from ..models import User, PaymentTransaction  # ✅ Swapped Subscription for PaymentTransaction
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
    
    # Log the transaction in PaymentTransaction
    new_payment = PaymentTransaction(
        user_id=current_user.id,
        tx_ref=f"sub-{current_user.id}-{int(datetime.utcnow().timestamp())}",
        plan_type=sub_data.subscription_type,
        amount=sub_data.amount,
        currency="ETB",
        status="approved",
        payment_status="completed",
        reviewed_at=datetime.utcnow(),
        created_at=datetime.utcnow()
    )
    db.add(new_payment)
    
    # Update user subscription flags
    current_user.has_active_subscription = True
    current_user.subscription_plan = sub_data.subscription_type
    current_user.subscription_start_date = datetime.utcnow()
    current_user.subscription_end_date = datetime.utcnow() + timedelta(days=180)
    current_user.can_create_listings = True
    current_user.payment_approved = True
    current_user.is_activated = True
    current_user.status = "active"

    if sub_data.subscription_type in ["selling", "both"]:
        current_user.seller_paid = True
        current_user.seller_enabled = True
        current_user.seller_approved = True
        current_user.role_type = "dual" if sub_data.subscription_type == "both" else "seller"
    
    if sub_data.subscription_type in ["renting", "both"]:
        current_user.landlord_paid = True
        current_user.landlord_enabled = True
        current_user.landlord_approved = True
        current_user.role_type = "dual" if sub_data.subscription_type == "both" else "landlord"
    
    if sub_data.subscription_type == "both":
        current_user.role_type = "dual"
    
    db.commit()
    db.refresh(new_payment)
    
    return {
        "success": True,
        "message": f"Subscription activated for {sub_data.subscription_type}",
        "subscription_id": new_payment.id
    }


@router.get("/my-subscription")
async def get_my_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns user's subscription info — reads directly from User model."""
    try:
        is_active = (
            current_user.has_active_subscription is True
            and current_user.subscription_end_date is not None
            and current_user.subscription_end_date > datetime.utcnow()
        )
        
        return {
            "success": True,
            "has_subscription": is_active,
            "plan_name": current_user.subscription_plan,
            "plan_type": current_user.subscription_plan,
            "amount": None,
            "start_date": current_user.subscription_start_date.isoformat() if current_user.subscription_start_date else None,
            "subscription_start_date": current_user.subscription_start_date.isoformat() if current_user.subscription_start_date else None,
            "end_date": current_user.subscription_end_date.isoformat() if current_user.subscription_end_date else None,
            "subscription_end_date": current_user.subscription_end_date.isoformat() if current_user.subscription_end_date else None,
            "is_active": is_active,
            "can_create_listings": current_user.can_create_listings or False,
            "is_activated": current_user.is_activated,
            "status": current_user.status,
        }
    except Exception as e:
        print(f"Error in my-subscription: {e}")
        return {
            "success": False,
            "has_subscription": False,
            "error": str(e)
        }