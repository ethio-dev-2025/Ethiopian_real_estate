
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from ..models import User
from .auth import get_current_user


router = APIRouter()


# ---------------------------------------------------------
# GET CURRENT USER SUBSCRIPTION
# ---------------------------------------------------------

@router.get("/my-subscription")
async def get_my_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Return the authenticated user's subscription information.
    """

    try:
        now = datetime.utcnow()

        is_active = (
            current_user.has_active_subscription is True
            and current_user.subscription_end_date is not None
            and current_user.subscription_end_date > now
        )

        return {
            "success": True,
            "has_subscription": is_active,

            "plan_name": current_user.subscription_plan,
            "plan_type": current_user.subscription_plan,

            "amount": None,

            "start_date": (
                current_user.subscription_start_date.isoformat()
                if current_user.subscription_start_date else None
            ),

            "subscription_start_date": (
                current_user.subscription_start_date.isoformat()
                if current_user.subscription_start_date else None
            ),

            "end_date": (
                current_user.subscription_end_date.isoformat()
                if current_user.subscription_end_date else None
            ),

            "subscription_end_date": (
                current_user.subscription_end_date.isoformat()
                if current_user.subscription_end_date else None
            ),

            "is_active": is_active,

            "can_create_listings": (
                bool(current_user.can_create_listings)
                and is_active
            ),

            "is_activated": bool(current_user.is_activated),

            "payment_approved": bool(current_user.payment_approved),

            "status": current_user.status,

            "seller_enabled": bool(current_user.seller_enabled),
            "landlord_enabled": bool(current_user.landlord_enabled),

            "seller_paid": bool(current_user.seller_paid),
            "landlord_paid": bool(current_user.landlord_paid)
        }

    except Exception as e:
        print(f"Subscription retrieval error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Could not retrieve subscription information."
        )


# ---------------------------------------------------------
# DISABLE DIRECT SUBSCRIPTION ACTIVATION
# ---------------------------------------------------------

@router.post("/create")
async def create_subscription():
    """
    Direct activation is disabled.

    Users must pay through Chapa:
    POST /api/payment/initialize

    Subscription activation happens only after
    server-side payment verification.
    """

    raise HTTPException(
        status_code=410,
        detail=(
            "Direct subscription activation is disabled. "
            "Please initialize payment through Chapa."
        )
    )


print("Subscription router loaded successfully!")
