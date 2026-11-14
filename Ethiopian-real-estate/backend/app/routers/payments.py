
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation
from typing import Optional
from urllib.parse import quote
import httpx
import os
import secrets

from ..database import get_db
from ..models import User, PaymentTransaction, ActivationRequest
from .auth import get_current_user, get_current_admin_user


router = APIRouter()

# ---------------------------------------------------------
# CHAPA CONFIGURATION
# ---------------------------------------------------------

CHAPA_SECRET_KEY = os.getenv("CHAPA_SECRET_KEY")
CHAPA_BASE_URL = "https://api.chapa.co/v1"

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "https://ethiopian-real-estate-mel.onrender.com"
).rstrip("/")

BASE_URL = os.getenv(
    "BASE_URL",
    "https://ethiopian-real-estate.onrender.com"
).rstrip("/")


def check_chapa_configuration():
    if not CHAPA_SECRET_KEY:
        raise HTTPException(
            status_code=503,
            detail="Payment service is not configured. Contact support."
        )


def get_chapa_headers():
    check_chapa_configuration()

    return {
        "Authorization": f"Bearer {CHAPA_SECRET_KEY}",
        "Content-Type": "application/json"
    }


def get_chapa_client():
    # Keep SSL verification enabled in production.
    return httpx.AsyncClient(timeout=60.0)


# ---------------------------------------------------------
# REQUEST SCHEMA
# ---------------------------------------------------------

class InitializePaymentRequest(BaseModel):
    plan_type: str
    amount: float = Field(gt=0)

    # Kept optional for compatibility with your existing
    # frontend. The backend uses the authenticated user's
    # stored details instead of trusting these values.
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


# ---------------------------------------------------------
# PLAN VALIDATION
# ---------------------------------------------------------

ALLOWED_PLANS = {"seller", "landlord", "dual"}


def validate_user_plan(user: User, plan_type: str):
    if plan_type not in ALLOWED_PLANS:
        raise HTTPException(
            status_code=400,
            detail="Invalid subscription plan."
        )

    if plan_type in ("seller", "dual"):
        if not user.seller_approved:
            raise HTTPException(
                status_code=403,
                detail="Seller verification has not been approved."
            )

    if plan_type in ("landlord", "dual"):
        if not user.landlord_approved:
            raise HTTPException(
                status_code=403,
                detail="Landlord verification has not been approved."
            )


# ---------------------------------------------------------
# ACTIVATE USER AFTER VERIFIED PAYMENT
# ---------------------------------------------------------

def activate_user(
    user: User,
    plan_type: str,
    amount: float,
    transaction_id: str,
    db: Session
):
    plan_name = str(plan_type).lower().strip()

    if plan_name not in ALLOWED_PLANS:
        raise ValueError("Invalid subscription plan.")

    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=180)

    # Common subscription fields
    user.is_activated = True
    user.payment_approved = True
    user.can_create_listings = True
    user.has_active_subscription = True
    user.subscription_plan = plan_name
    user.subscription_start_date = start_date
    user.subscription_end_date = end_date
    user.status = "active"
    user.payment_status = "completed"

    if hasattr(user, "activated_at"):
        user.activated_at = start_date

    # Do not change seller_approved or landlord_approved here.
    # Verification approval must happen before payment.

    if plan_name == "seller":
        user.role_type = "seller"
        user.seller_enabled = True
        user.seller_paid = True

    elif plan_name == "landlord":
        user.role_type = "landlord"
        user.landlord_enabled = True
        user.landlord_paid = True

    elif plan_name == "dual":
        user.role_type = "dual"

        user.seller_enabled = True
        user.seller_paid = True

        user.landlord_enabled = True
        user.landlord_paid = True

    # Update the latest activation request if one exists.
    activation_request = (
        db.query(ActivationRequest)
        .filter(ActivationRequest.user_id == user.id)
        .order_by(ActivationRequest.created_at.desc())
        .first()
    )

    if activation_request:
        activation_request.status = "fully_activated"
        activation_request.plan_type = plan_name
        activation_request.payment_amount = amount
        activation_request.payment_transaction_id = transaction_id
        activation_request.payment_approved_at = datetime.utcnow()

    else:
        new_activation = ActivationRequest(
            user_id=user.id,
            full_name=user.full_name or user.username,
            email=user.email,
            phone_number=user.phone or "",
            property_address="Subscription Activation",
            property_type="activation",
            status="fully_activated",
            plan_type=plan_name,
            payment_amount=amount,
            payment_transaction_id=transaction_id,
            payment_approved_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        )

        db.add(new_activation)

    return end_date


# ---------------------------------------------------------
# CHAPA TRANSACTION VERIFICATION
# ---------------------------------------------------------

async def verify_with_chapa(tx_ref: str):
    check_chapa_configuration()

    async with get_chapa_client() as client:
        response = await client.get(
            f"{CHAPA_BASE_URL}/transaction/verify/{quote(tx_ref, safe='')}",
            headers=get_chapa_headers()
        )

    if response.status_code != 200:
        print(
            f"Chapa verification HTTP {response.status_code}: "
            f"{response.text}"
        )

        raise HTTPException(
            status_code=502,
            detail="Unable to verify transaction with payment provider."
        )

    try:
        result = response.json()
    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="Invalid response from payment provider."
        )

    payment_data = result.get("data") or {}

    if (
        result.get("status") != "success"
        or payment_data.get("status") != "success"
    ):
        return None

    # Validate transaction reference when returned by Chapa.
    returned_tx_ref = payment_data.get("tx_ref")

    if returned_tx_ref and returned_tx_ref != tx_ref:
        raise HTTPException(
            status_code=400,
            detail="Transaction reference mismatch."
        )

    return payment_data


# ---------------------------------------------------------
# INITIALIZE PAYMENT
# ---------------------------------------------------------

@router.post("/initialize")
async def initialize_payment(
    payment_data: InitializePaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        plan_type = str(payment_data.plan_type).lower().strip()
        amount = float(payment_data.amount)

        validate_user_plan(current_user, plan_type)
        check_chapa_configuration()

        if amount <= 0:
            raise HTTPException(
                status_code=400,
                detail="Invalid payment amount."
            )

        # Use the authenticated user's stored information.
        email = current_user.email

        if not email:
            raise HTTPException(
                status_code=400,
                detail="Your account does not have an email address."
            )

        full_name = (
            current_user.full_name
            or current_user.username
            or "Customer"
        ).strip()

        name_parts = full_name.split(maxsplit=1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else "Customer"

        phone = current_user.phone or ""

        if not phone:
            raise HTTPException(
                status_code=400,
                detail="Please add a phone number to your account."
            )

        tx_ref = (
            f"{plan_type}-{current_user.id}-"
            f"{secrets.token_hex(8)}"
        )

        # Save pending transaction before contacting Chapa.
        payment = PaymentTransaction(
            user_id=current_user.id,
            tx_ref=tx_ref,
            plan_type=plan_type,
            amount=amount,
            currency="ETB",
            status="pending",
            payment_status="initiated",
            created_at=datetime.utcnow()
        )

        db.add(payment)
        db.commit()
        db.refresh(payment)

        callback_url = f"{BASE_URL}/api/payment/webhook"

        return_url = (
            f"{FRONTEND_URL}/payment/success"
            f"?tx_ref={quote(tx_ref, safe='')}"
        )

        payload = {
            "amount": str(amount),
            "currency": "ETB",
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "phone_number": phone,
            "tx_ref": tx_ref,
            "callback_url": callback_url,
            "return_url": return_url,
            "title": f"{plan_type.capitalize()} Subscription",
            "description": (
                f"180-day subscription for {plan_type} account"
            )
        }

        async with get_chapa_client() as client:
            response = await client.post(
                f"{CHAPA_BASE_URL}/transaction/initialize",
                headers=get_chapa_headers(),
                json=payload
            )

        if response.status_code != 200:
            print(
                f"Chapa initialization HTTP {response.status_code}: "
                f"{response.text}"
            )

            payment.status = "failed"
            payment.payment_status = "failed"
            db.commit()

            raise HTTPException(
                status_code=502,
                detail="Payment initialization failed. Please try again."
            )

        try:
            result = response.json()
        except ValueError:
            payment.status = "failed"
            payment.payment_status = "failed"
            db.commit()

            raise HTTPException(
                status_code=502,
                detail="Invalid response from payment provider."
            )

        checkout_url = (
            (result.get("data") or {}).get("checkout_url")
        )

        if result.get("status") != "success" or not checkout_url:
            print("Chapa initialization response:", result)

            payment.status = "failed"
            payment.payment_status = "failed"
            db.commit()

            raise HTTPException(
                status_code=502,
                detail="Payment provider did not return a checkout URL."
            )

        return {
            "success": True,
            "message": "Payment initialized successfully.",
            "checkout_url": checkout_url,
            "tx_ref": tx_ref
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        print(f"Payment initialization error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Could not initialize payment."
        )


# ---------------------------------------------------------
# BROWSER RETURN URL
# ---------------------------------------------------------

@router.get("/success")
async def payment_success(tx_ref: str):
    # A browser redirect is NOT proof of payment.
    # The frontend must call /verify after this redirect.
    return RedirectResponse(
        url=(
            f"{FRONTEND_URL}/payment/success"
            f"?tx_ref={quote(tx_ref, safe='')}"
        ),
        status_code=303
    )


# ---------------------------------------------------------
# VERIFY PAYMENT AND ACTIVATE ACCOUNT
# ---------------------------------------------------------

@router.get("/verify")
async def verify_payment(
    tx_ref: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payment = (
        db.query(PaymentTransaction)
        .filter(
            PaymentTransaction.tx_ref == tx_ref,
            PaymentTransaction.user_id == current_user.id
        )
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment transaction not found."
        )

    if payment.status == "approved" and current_user.is_activated:
        return {
            "success": True,
            "activated": True,
            "message": "Payment has already been verified."
        }

    if payment.status == "failed":
        return {
            "success": False,
            "activated": False,
            "message": "This payment transaction has failed."
        }

    try:
        payment_data = await verify_with_chapa(tx_ref)

        if not payment_data:
            return {
                "success": False,
                "activated": False,
                "message": "Payment has not been completed."
            }

        # Verify amount and currency against our pending record.
        try:
            chapa_amount = Decimal(str(payment_data.get("amount")))
            expected_amount = Decimal(str(payment.amount))
        except (InvalidOperation, TypeError):
            raise HTTPException(
                status_code=400,
                detail="Invalid transaction amount returned by provider."
            )

        if chapa_amount != expected_amount:
            raise HTTPException(
                status_code=400,
                detail="Payment amount does not match the expected amount."
            )

        if payment_data.get("currency") != payment.currency:
            raise HTTPException(
                status_code=400,
                detail="Payment currency does not match."
            )

        # Check plan approval again before activation.
        validate_user_plan(current_user, payment.plan_type)

        transaction_id = (
            payment_data.get("reference")
            or payment_data.get("transaction_id")
            or tx_ref
        )

        payment.status = "approved"
        payment.payment_status = "completed"
        payment.transaction_id = str(transaction_id)
        payment.reviewed_at = datetime.utcnow()

        end_date = activate_user(
            user=current_user,
            plan_type=payment.plan_type,
            amount=payment.amount,
            transaction_id=str(transaction_id),
            db=db
        )

        db.commit()
        db.refresh(payment)

        return {
            "success": True,
            "activated": True,
            "message": "Payment verified. Subscription activated.",
            "tx_ref": tx_ref,
            "subscription_end_date": end_date.isoformat()
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()
        print(f"Payment verification error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Payment verification failed."
        )


# ---------------------------------------------------------
# CHAPA WEBHOOK
# ---------------------------------------------------------

@router.post("/webhook")
async def chapa_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Do not trust the webhook JSON status by itself.
    Verify the transaction directly with Chapa.
    """

    try:
        body = await request.json()
        tx_ref = body.get("tx_ref")

        if not tx_ref:
            raise HTTPException(
                status_code=400,
                detail="Missing transaction reference."
            )

        payment = (
            db.query(PaymentTransaction)
            .filter(PaymentTransaction.tx_ref == tx_ref)
            .first()
        )

        if not payment:
            raise HTTPException(
                status_code=404,
                detail="Payment transaction not found."
            )

        if payment.status == "approved":
            return {"status": "already_processed"}

        payment_data = await verify_with_chapa(tx_ref)

        if not payment_data:
            return {
                "status": "pending",
                "message": "Payment is not yet successful."
            }

        try:
            chapa_amount = Decimal(str(payment_data.get("amount")))
            expected_amount = Decimal(str(payment.amount))
        except (InvalidOperation, TypeError):
            raise HTTPException(
                status_code=400,
                detail="Invalid transaction amount."
            )

        if chapa_amount != expected_amount:
            raise HTTPException(
                status_code=400,
                detail="Payment amount mismatch."
            )

        if payment_data.get("currency") != payment.currency:
            raise HTTPException(
                status_code=400,
                detail="Payment currency mismatch."
            )

        user = (
            db.query(User)
            .filter(User.id == payment.user_id)
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=404,
                detail="Payment user not found."
            )

        validate_user_plan(user, payment.plan_type)

        transaction_id = (
            payment_data.get("reference")
            or payment_data.get("transaction_id")
            or tx_ref
        )

        payment.status = "approved"
        payment.payment_status = "completed"
        payment.transaction_id = str(transaction_id)
        payment.reviewed_at = datetime.utcnow()

        activate_user(
            user=user,
            plan_type=payment.plan_type,
            amount=payment.amount,
            transaction_id=str(transaction_id),
            db=db
        )

        db.commit()

        return {
            "status": "success",
            "message": "Payment verified and account activated."
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()
        print(f"Chapa webhook error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Webhook processing failed."
        )


# ---------------------------------------------------------
# ADMIN: GET PAYMENTS
# ---------------------------------------------------------

@router.get("/admin/payments")
async def get_all_payments(
    status: str = "all",
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(PaymentTransaction)

        if status in ("pending", "approved", "failed"):
            query = query.filter(
                PaymentTransaction.status == status
            )

        payments = (
            query.order_by(PaymentTransaction.created_at.desc())
            .all()
        )

        result = []

        for payment in payments:
            user = (
                db.query(User)
                .filter(User.id == payment.user_id)
                .first()
            )

            result.append({
                "id": payment.id,
                "user_id": payment.user_id,
                "user_name": (
                    (user.full_name or user.username)
                    if user else "Unknown"
                ),
                "user_email": user.email if user else "Unknown",
                "phone_number": user.phone if user else "",
                "plan_type": payment.plan_type,
                "amount": payment.amount,
                "currency": payment.currency,
                "status": payment.status,
                "payment_status": payment.payment_status,
                "transaction_id": payment.transaction_id or payment.tx_ref,
                "created_at": (
                    payment.created_at.isoformat()
                    if payment.created_at else None
                ),
                "reviewed_at": (
                    payment.reviewed_at.isoformat()
                    if payment.reviewed_at else None
                ),
                "user_is_activated": (
                    user.is_activated if user else False
                )
            })

        return result

    except Exception as e:
        print(f"Admin payments error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Could not retrieve payments."
        )


# ---------------------------------------------------------
# USER PAYMENT RECEIPT
# ---------------------------------------------------------

@router.get("/receipt/{payment_id}")
async def get_payment_receipt(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payment = (
        db.query(PaymentTransaction)
        .filter(
            PaymentTransaction.id == payment_id,
            PaymentTransaction.user_id == current_user.id
        )
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found."
        )

    user = (
        db.query(User)
        .filter(User.id == payment.user_id)
        .first()
    )

    return {
        "success": True,
        "receipt": {
            "transaction_id": payment.transaction_id or payment.tx_ref,
            "date": (
                payment.created_at.isoformat()
                if payment.created_at else datetime.utcnow().isoformat()
            ),
            "plan_type": payment.plan_type,
            "amount": payment.amount,
            "currency": payment.currency or "ETB",
            "status": payment.status,
            "user_name": (
                (user.full_name or user.username)
                if user else "Unknown"
            ),
            "user_email": user.email if user else "Unknown",
            "user_phone": user.phone if user else "N/A",
            "payment_method": "Chapa",
            "business_name": "EstateHub Real Estate",
            "business_tin": "0071406415",
            "business_phone": "+251-960724272",
            "business_website": "www.estatehub.com",
            "business_address": "Addis Ababa, Ethiopia"
        }
    }


print("Payment router loaded successfully!")
