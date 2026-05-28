from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, inspect
from datetime import datetime, timedelta
from typing import Optional
from ..database import get_db
from ..models import User, Listing, ActivationRequest
from ..models.payment import PaymentTransaction
from .auth import get_current_admin_user
from pydantic import BaseModel

router = APIRouter()

# ============ PYDANTIC MODELS ============
class UserUpdateRequest(BaseModel):
    status: Optional[str] = None
    role_type: Optional[str] = None
    is_activated: Optional[bool] = None


# ============ REAL PAYMENT MANAGEMENT (CRITICAL FIX) ============
@router.get("/real-payments")
async def get_real_payments(
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    status: Optional[str] = "pending"
):
    """Get real payment transactions from database - NOT MOCK DATA"""
    try:
        print(f"📊 Fetching payments with status: {status}")
        
        inspector = inspect(db.get_bind())
        if not inspector.has_table("payment_transactions"):
            print("⚠️ payment_transactions table does not exist! Creating...")
            return []
        
        query = db.query(PaymentTransaction)
        if status and status != "all":
            query = query.filter(PaymentTransaction.status == status)
        
        payments = query.order_by(PaymentTransaction.created_at.desc()).all()
        
        print(f"📊 Found {len(payments)} payments in database")
        
        result = []
        for payment in payments:
            user = db.query(User).filter(User.id == payment.user_id).first()
            result.append({
                "id": payment.id,
                "user_id": payment.user_id,
                "user_name": user.full_name or user.username if user else "Unknown",
                "user_email": user.email if user else "Unknown",
                "phone_number": user.phone if user else "",
                "plan_type": payment.plan_type,
                "amount": payment.amount,
                "status": payment.status,
                "rejection_reason": payment.rejection_reason,
                "transaction_id": payment.transaction_id or f"TXN-{payment.id}",
                "created_at": payment.created_at.isoformat() if payment.created_at else None,
                "reviewed_at": payment.reviewed_at.isoformat() if payment.reviewed_at else None,
                "payment_status": payment.payment_status
            })
        
        print(f"✅ Returning {len(result)} payments")
        return result
        
    except Exception as e:
        print(f"❌ Error getting payments: {e}")
        import traceback
        traceback.print_exc()
        return []


@router.post("/approve-payment/{payment_id}")
async def approve_payment(
    payment_id: int,
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Approve a payment and activate user"""
    try:
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        if payment.status != "pending":
            raise HTTPException(status_code=400, detail=f"Payment already {payment.status}")
        
        user = db.query(User).filter(User.id == payment.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        payment.status = "approved"
        payment.reviewed_by = current_user.id
        payment.reviewed_at = datetime.utcnow()
        
        user.payment_approved = True
        user.can_create_listings = True
        user.payment_status = "approved"
        user.is_activated = True
        user.status = "active"
        user.has_active_subscription = True
        user.subscription_plan = payment.plan_type
        user.subscription_start_date = datetime.utcnow()
        user.subscription_end_date = datetime.utcnow() + timedelta(days=30)
        
        if payment.plan_type == "seller" or payment.plan_type == "dual":
            user.seller_enabled = True
            user.seller_approved = True
            user.seller_paid = True
        if payment.plan_type == "landlord" or payment.plan_type == "dual":
            user.landlord_enabled = True
            user.landlord_approved = True
            user.landlord_paid = True
        if payment.plan_type == "dual":
            user.role_type = "dual"
        elif payment.plan_type == "seller":
            user.role_type = "seller"
        elif payment.plan_type == "landlord":
            user.role_type = "landlord"
        
        db.commit()
        
        print(f"✅ Payment {payment_id} approved for user {user.email}")
        
        return {"success": True, "message": "Payment approved and account activated"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error approving payment: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reject-payment/{payment_id}")
async def reject_payment(
    payment_id: int,
    rejection_data: dict,
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Reject a payment"""
    try:
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        if payment.status != "pending":
            raise HTTPException(status_code=400, detail=f"Payment already {payment.status}")
        
        reason = rejection_data.get("reason", "No reason provided")
        
        user = db.query(User).filter(User.id == payment.user_id).first()
        
        payment.status = "rejected"
        payment.rejection_reason = reason
        payment.reviewed_by = current_user.id
        payment.reviewed_at = datetime.utcnow()
        
        if user:
            user.payment_status = "rejected"
            user.payment_approved = False
            user.can_create_listings = False
            if payment.plan_type == "seller" or payment.plan_type == "dual":
                user.seller_paid = False
                user.seller_enabled = False
                user.seller_approved = False
            if payment.plan_type == "landlord" or payment.plan_type == "dual":
                user.landlord_paid = False
                user.landlord_enabled = False
                user.landlord_approved = False
        
        db.commit()
        
        print(f"❌ Payment {payment_id} rejected for user {user.email if user else 'Unknown'}")
        
        return {"success": True, "message": "Payment rejected"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error rejecting payment: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/payment-receipt/{payment_id}")
async def get_payment_receipt(
    payment_id: int,
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get payment receipt details"""
    try:
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        user = db.query(User).filter(User.id == payment.user_id).first()
        
        return {
            "success": True,
            "receipt": {
                "transaction_id": payment.transaction_id or f"EST-{payment.id}",
                "date": payment.created_at.isoformat() if payment.created_at else datetime.utcnow().isoformat(),
                "plan_type": payment.plan_type,
                "amount": payment.amount,
                "currency": payment.currency,
                "status": payment.status,
                "user_name": user.full_name or user.username if user else "Unknown",
                "user_email": user.email if user else "Unknown",
                "payment_method": "Chapa"
            }
        }
        
    except Exception as e:
        print(f"Error getting receipt: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ STATS ENDPOINTS ============
@router.get("/stats/users")
async def get_user_stats(
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get user statistics"""
    try:
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.status == "active").count()
        pending_users = db.query(User).filter(User.status == "pending").count()
        suspended_users = db.query(User).filter(User.status == "suspended").count()
        verified_users = db.query(User).filter(User.is_verified == True).count()
        
        user_growth = []
        for i in range(5, -1, -1):
            month_date = datetime.utcnow() - timedelta(days=30 * i)
            count = db.query(User).filter(
                func.extract('year', User.created_at) == month_date.year,
                func.extract('month', User.created_at) == month_date.month
            ).count()
            user_growth.append({
                "month": month_date.strftime("%b"),
                "count": count
            })
        
        return {
            "total": total_users,
            "active": active_users,
            "pending": pending_users,
            "suspended": suspended_users,
            "verified": verified_users,
            "growth": user_growth
        }
    except Exception as e:
        print(f"Error in user stats: {e}")
        return {"total": 0, "active": 0, "pending": 0, "suspended": 0, "verified": 0, "growth": []}


@router.get("/stats/listings")
async def get_listings_stats(
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get listings statistics"""
    try:
        total_listings = db.query(Listing).count()
        active_listings = db.query(Listing).filter(Listing.status == "active").count()
        pending_listings = db.query(Listing).filter(Listing.status == "pending").count()
        draft_listings = db.query(Listing).filter(Listing.is_draft == True).count()
        
        for_sale = db.query(Listing).filter(Listing.listing_type == "sale").count()
        for_rent = db.query(Listing).filter(Listing.listing_type == "rent").count()
        
        property_types = {}
        for p_type in ["house", "apartment", "villa", "condo", "commercial", "land"]:
            count = db.query(Listing).filter(Listing.property_type == p_type).count()
            property_types[p_type] = count
        
        return {
            "total": total_listings,
            "active": active_listings,
            "pending": pending_listings,
            "draft": draft_listings,
            "for_sale": for_sale,
            "for_rent": for_rent,
            "by_property_type": property_types
        }
    except Exception as e:
        print(f"Error in listings stats: {e}")
        return {"total": 0, "active": 0, "pending": 0, "draft": 0, "for_sale": 0, "for_rent": 0, "by_property_type": {}}


@router.get("/stats/verifications")
async def get_verifications_stats(
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get verification statistics"""
    try:
        pending_activations = db.query(ActivationRequest).filter(
            ActivationRequest.status == "pending"
        ).count()
        approved_activations = db.query(ActivationRequest).filter(
            ActivationRequest.status == "approved"
        ).count()
        rejected_activations = db.query(ActivationRequest).filter(
            ActivationRequest.status == "rejected"
        ).count()
        
        return {
            "pending": pending_activations,
            "approved": approved_activations,
            "rejected": rejected_activations,
            "total": pending_activations + approved_activations + rejected_activations
        }
    except Exception as e:
        print(f"Error in verifications stats: {e}")
        return {"pending": 0, "approved": 0, "rejected": 0, "total": 0}


@router.get("/stats/revenue")
async def get_revenue_stats(
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get revenue statistics"""
    try:
        approved_payments = db.query(PaymentTransaction).filter(
            PaymentTransaction.status == "approved"
        ).all()
        total_revenue = sum(p.amount for p in approved_payments)
        
        return {
            "total": total_revenue,
            "this_month": 0,
            "last_month": 0,
            "trend": []
        }
    except Exception as e:
        print(f"Error in revenue stats: {e}")
        return {"total": 0, "this_month": 0, "last_month": 0, "trend": []}


# ============ DASHBOARD STATS ============
@router.get("/dashboard-stats")
async def get_dashboard_stats(
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        total_users = db.query(User).count()
        verified_users = db.query(User).filter(User.is_verified == True).count()
        
        total_properties = db.query(Listing).count()
        properties_for_sale = db.query(Listing).filter(Listing.listing_type == "sale").count()
        properties_for_rent = db.query(Listing).filter(Listing.listing_type == "rent").count()
        active_properties = db.query(Listing).filter(Listing.status == "active").count()
        
        pending_activations = db.query(ActivationRequest).filter(ActivationRequest.status == "pending").count()
        pending_payments = db.query(PaymentTransaction).filter(PaymentTransaction.status == "pending").count()
        
        user_growth = []
        for i in range(5, -1, -1):
            month_date = datetime.utcnow() - timedelta(days=30 * i)
            count = db.query(User).filter(
                func.extract('year', User.created_at) == month_date.year,
                func.extract('month', User.created_at) == month_date.month
            ).count()
            user_growth.append({
                "month": month_date.strftime("%b"),
                "count": count
            })
        
        approved_payments = db.query(PaymentTransaction).filter(
            PaymentTransaction.status == "approved"
        ).all()
        total_revenue = sum(p.amount for p in approved_payments)
        
        return {
            "total_users": total_users,
            "verified_users": verified_users,
            "unverified_users": total_users - verified_users,
            "total_properties": total_properties,
            "properties_for_sale": properties_for_sale,
            "properties_for_rent": properties_for_rent,
            "active_properties": active_properties,
            "total_revenue": total_revenue,
            "pending_activations": pending_activations,
            "pending_payments": pending_payments,
            "user_growth": user_growth,
            "revenue_trends": []
        }
        
    except Exception as e:
        print(f"Error in dashboard-stats: {e}")
        return {
            "total_users": 0,
            "verified_users": 0,
            "unverified_users": 0,
            "total_properties": 0,
            "properties_for_sale": 0,
            "properties_for_rent": 0,
            "active_properties": 0,
            "total_revenue": 0,
            "pending_activations": 0,
            "pending_payments": 0,
            "user_growth": [],
            "revenue_trends": []
        }


# ============ USER MANAGEMENT - FIXED ============
@router.get("/users")
async def get_all_users(
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    try:
        query = db.query(User)
        
        if search:
            query = query.filter(
                (User.email.ilike(f"%{search}%")) | 
                (User.username.ilike(f"%{search}%")) |
                (User.full_name.ilike(f"%{search}%"))
            )
        
        if status and status != "all":
            query = query.filter(User.status == status)
        
        total = query.count()
        users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
        
        result = []
        for user in users:
            if user.is_verified and user.status == "active":
                status_display = "Verified"
            elif user.status == "active":
                status_display = "Active"
            elif user.status == "suspended":
                status_display = "Suspended"
            else:
                status_display = "Pending"
            
            result.append({
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "phone": user.phone,
                "role_type": user.role_type,
                "status": user.status,
                "status_display": status_display,
                "is_verified": user.is_verified,
                "is_activated": user.is_activated,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "last_login": user.last_login.isoformat() if user.last_login else None,
                "has_active_subscription": user.has_active_subscription,
                "payment_approved": user.payment_approved,
                "seller_documents_submitted": user.seller_documents_submitted,
                "landlord_documents_submitted": user.landlord_documents_submitted
            })
        
        return {"total": total, "users": result}
        
    except Exception as e:
        print(f"Error getting users: {e}")
        return {"total": 0, "users": []}


@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    user_data: UserUpdateRequest,
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user_data.status is not None:
            user.status = user_data.status
        if user_data.role_type is not None:
            user.role_type = user_data.role_type
        if user_data.is_activated is not None:
            user.is_activated = user_data.is_activated
        
        db.commit()
        
        return {"success": True, "message": "User updated successfully"}
        
    except Exception as e:
        print(f"Error updating user: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
        db.delete(user)
        db.commit()
        
        return {"success": True, "message": "User deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting user: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/{user_id}/verify")
async def verify_user(
    user_id: int,
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.is_verified = True
        user.status = "active"
        user.is_activated = True
        db.commit()
        
        return {"success": True, "message": "User verified successfully"}
        
    except Exception as e:
        print(f"Error verifying user: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/{user_id}/suspend")
async def suspend_user(
    user_id: int,
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot suspend your own account")
        
        user.status = "suspended"
        user.is_activated = False
        db.commit()
        
        return {"success": True, "message": "User suspended successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error suspending user: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/{user_id}/activate")
async def activate_user(
    user_id: int,
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.status = "active"
        user.is_activated = True
        db.commit()
        
        return {"success": True, "message": "User activated successfully"}
        
    except Exception as e:
        print(f"Error activating user: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ VERIFICATION QUEUE ============
@router.get("/verification-queue")
async def get_verification_queue(
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    status: Optional[str] = "pending"
):
    try:
        query = db.query(ActivationRequest)
        
        if status and status != "all":
            query = query.filter(ActivationRequest.status == status)
        
        requests = query.order_by(ActivationRequest.created_at.desc()).all()
        
        result = []
        for req in requests:
            user = db.query(User).filter(User.id == req.user_id).first()
            result.append({
                "id": req.id,
                "user_id": req.user_id,
                "user_name": user.full_name if user else req.full_name,
                "user_email": user.email if user else req.email,
                "full_name": req.full_name,
                "email": req.email,
                "phone_number": req.phone_number,
                "property_address": req.property_address,
                "property_type": req.property_type,
                "business_name": req.business_name,
                "tax_id": req.tax_id,
                "experience_years": req.experience_years,
                "reason_for_activation": req.reason_for_activation,
                "status": req.status,
                "rejection_reason": req.rejection_reason,
                "created_at": req.created_at.isoformat() if req.created_at else None,
                "reviewed_at": req.reviewed_at.isoformat() if req.reviewed_at else None
            })
        
        return result
        
    except Exception as e:
        print(f"Error in verification-queue: {e}")
        return []


# ============ REPORTS & ANALYTICS ============
@router.get("/reports")
async def get_reports(
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        user_stats = []
        for i in range(11, -1, -1):
            month_date = datetime.utcnow() - timedelta(days=30 * i)
            count = db.query(User).filter(
                func.extract('year', User.created_at) == month_date.year,
                func.extract('month', User.created_at) == month_date.month
            ).count()
            user_stats.append({
                "month": month_date.strftime("%b %Y"),
                "registrations": count
            })
        
        property_stats = {
            "total": db.query(Listing).count(),
            "for_sale": db.query(Listing).filter(Listing.listing_type == "sale").count(),
            "for_rent": db.query(Listing).filter(Listing.listing_type == "rent").count(),
            "active": db.query(Listing).filter(Listing.status == "active").count(),
            "pending": db.query(Listing).filter(Listing.status == "pending").count(),
            "draft": db.query(Listing).filter(Listing.status == "draft").count()
        }
        
        approved_payments = db.query(PaymentTransaction).filter(
            PaymentTransaction.status == "approved"
        ).all()
        total_revenue = sum(p.amount for p in approved_payments)
        
        return {
            "user_registrations": user_stats,
            "property_stats": property_stats,
            "revenue_stats": {"total": total_revenue, "this_month": 0, "last_month": 0}
        }
        
    except Exception as e:
        print(f"Error in reports: {e}")
        return {
            "user_registrations": [],
            "property_stats": {},
            "revenue_stats": {}
        }


# ============ RECENT ACTIVITIES ============
@router.get("/recent-activities")
async def get_recent_activities(
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Get recent platform activities"""
    try:
        activities = []
        
        recent_users = db.query(User).order_by(User.created_at.desc()).limit(5).all()
        for user in recent_users:
            activities.append({
                "id": f"user_{user.id}",
                "type": "user_registered",
                "title": "New User Registration",
                "description": f"{user.full_name or user.username} joined the platform",
                "user_name": user.full_name or user.username,
                "created_at": user.created_at.isoformat() if user.created_at else None
            })
        
        recent_listings = db.query(Listing).order_by(Listing.created_at.desc()).limit(5).all()
        for listing in recent_listings:
            user = db.query(User).filter(User.id == listing.user_id).first()
            activities.append({
                "id": f"listing_{listing.id}",
                "type": "new_listing",
                "title": "New Property Listed",
                "description": f"{listing.title} was listed for {listing.listing_type}",
                "user_name": user.full_name or user.username if user else "Unknown",
                "created_at": listing.created_at.isoformat() if listing.created_at else None
            })
        
        recent_payments = db.query(PaymentTransaction).order_by(PaymentTransaction.created_at.desc()).limit(5).all()
        for payment in recent_payments:
            user = db.query(User).filter(User.id == payment.user_id).first()
            if user:
                activities.append({
                    "id": f"payment_{payment.id}",
                    "type": "new_payment",
                    "title": "New Payment Received",
                    "description": f"{user.full_name or user.username} paid for {payment.plan_type} plan",
                    "user_name": user.full_name or user.username,
                    "created_at": payment.created_at.isoformat() if payment.created_at else None
                })
        
        activities.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        return activities[:limit]
    except Exception as e:
        print(f"Error in recent activities: {e}")
        return []


print("✅ Admin router loaded successfully with real-payments endpoint!")