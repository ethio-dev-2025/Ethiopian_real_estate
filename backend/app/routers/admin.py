from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import Optional, List
from ..database import get_db
from ..models import User, Listing, ActivationRequest
from .auth import get_current_admin_user
from pydantic import BaseModel

router = APIRouter()

# ============ PYDANTIC MODELS ============
class UserUpdateRequest(BaseModel):
    status: Optional[str] = None
    role_type: Optional[str] = None
    is_activated: Optional[bool] = None

class PaymentApprovalRequest(BaseModel):
    status: str
    transaction_id: Optional[str] = None

# Mock payment data
mock_payments = []

# ============ DASHBOARD STATS ============
@router.get("/dashboard-stats")
async def get_dashboard_stats(
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        total_users = db.query(User).count()
        verified_users = db.query(User).filter(User.is_verified == True).count()
        unverified_users = total_users - verified_users
        
        total_properties = db.query(Listing).count()
        properties_for_sale = db.query(Listing).filter(Listing.listing_type == "sale").count()
        properties_for_rent = db.query(Listing).filter(Listing.listing_type == "rent").count()
        active_properties = db.query(Listing).filter(Listing.status == "active").count()
        
        pending_activations = db.query(ActivationRequest).filter(ActivationRequest.status == "pending").count()
        pending_payments = len([p for p in mock_payments if p.get("status") == "pending"])
        
        # User growth per month (last 6 months)
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
            "total_users": total_users,
            "verified_users": verified_users,
            "unverified_users": unverified_users,
            "total_properties": total_properties,
            "properties_for_sale": properties_for_sale,
            "properties_for_rent": properties_for_rent,
            "active_properties": active_properties,
            "total_revenue": 84500,
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

# ============ USER MANAGEMENT ============
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
            # Determine status display
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
                "registered_date": user.created_at.strftime("%m/%d/%Y") if user.created_at else "N/A",
                "last_login": user.last_login.isoformat() if user.last_login else None
            })
        
        return {
            "total": total,
            "users": result
        }
        
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

@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: int,
    status_data: dict,
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        new_status = status_data.get("status")
        if new_status:
            user.status = new_status
            if new_status == "active":
                user.is_activated = True
            elif new_status == "suspended":
                user.is_activated = False
        
        db.commit()
        
        return {"success": True, "message": f"User {new_status} successfully"}
        
    except Exception as e:
        print(f"Error updating user status: {e}")
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
        
        # Don't allow deleting yourself
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
        
        # Don't suspend yourself
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

# ============ PAYMENT APPROVALS ============
mock_payments = [
    {
        "id": 1,
        "user_id": 1,
        "user_name": "John Doe",
        "user_email": "john@example.com",
        "amount": 5000,
        "package": "Premium Plan",
        "status": "pending",
        "transaction_id": "TXN123456",
        "created_at": datetime.utcnow().isoformat()
    },
    {
        "id": 2,
        "user_id": 2,
        "user_name": "Jane Smith",
        "user_email": "jane@example.com",
        "amount": 10000,
        "package": "Business Plan",
        "status": "pending",
        "transaction_id": "TXN123457",
        "created_at": datetime.utcnow().isoformat()
    }
]

@router.get("/payment-approvals")
async def get_payment_approvals(
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    status: Optional[str] = "pending"
):
    try:
        if status and status != "all":
            payments = [p for p in mock_payments if p["status"] == status]
        else:
            payments = mock_payments
        
        return payments
        
    except Exception as e:
        print(f"Error in payment-approvals: {e}")
        return []

@router.post("/payment-approvals/{payment_id}/approve")
async def approve_payment(
    payment_id: int,
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        for payment in mock_payments:
            if payment["id"] == payment_id:
                payment["status"] = "approved"
                return {"success": True, "message": "Payment approved successfully"}
        
        raise HTTPException(status_code=404, detail="Payment not found")
        
    except Exception as e:
        print(f"Error approving payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/payment-approvals/{payment_id}/reject")
async def reject_payment(
    payment_id: int,
    rejection_data: dict,
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        for payment in mock_payments:
            if payment["id"] == payment_id:
                payment["status"] = "rejected"
                payment["rejection_reason"] = rejection_data.get("reason", "No reason provided")
                return {"success": True, "message": "Payment rejected"}
        
        raise HTTPException(status_code=404, detail="Payment not found")
        
    except Exception as e:
        print(f"Error rejecting payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ REPORTS & ANALYTICS ============
@router.get("/reports")
async def get_reports(
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        # User registration by month
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
        
        # Property statistics
        property_stats = {
            "total": db.query(Listing).count(),
            "for_sale": db.query(Listing).filter(Listing.listing_type == "sale").count(),
            "for_rent": db.query(Listing).filter(Listing.listing_type == "rent").count(),
            "active": db.query(Listing).filter(Listing.status == "active").count(),
            "pending": db.query(Listing).filter(Listing.status == "pending").count(),
            "draft": db.query(Listing).filter(Listing.status == "draft").count()
        }
        
        return {
            "user_registrations": user_stats,
            "property_stats": property_stats,
            "revenue_stats": {"total": 84500, "this_month": 25000, "last_month": 22000}
        }
        
    except Exception as e:
        print(f"Error in reports: {e}")
        return {
            "user_registrations": [],
            "property_stats": {},
            "revenue_stats": {}
        }

# ============ ADMIN PROFILE ============
@router.get("/profile")
async def get_admin_profile(
    current_user=Depends(get_current_admin_user)
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "role_type": current_user.role_type,
        "avatar_url": current_user.avatar_url
    }

@router.put("/profile")
async def update_admin_profile(
    profile_data: dict,
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        if "full_name" in profile_data:
            current_user.full_name = profile_data["full_name"]
        if "phone" in profile_data:
            current_user.phone = profile_data["phone"]
        
        db.commit()
        
        return {"success": True, "message": "Profile updated successfully"}
        
    except Exception as e:
        print(f"Error updating profile: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============ PLATFORM CONFIG ============
@router.get("/platform-config")
async def get_platform_config(
    current_user=Depends(get_current_admin_user)
):
    return {
        "site_name": "Ethio Real Estate",
        "site_logo": "/logo.png",
        "contact_email": "admin@ethiorealestate.com",
        "contact_phone": "+251 911 111 111",
        "maintenance_mode": False,
        "registration_enabled": True
    }

# Add these endpoints to your existing admin.py

# ============ ADMIN STATS ENDPOINTS ============
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
        
        # User growth last 6 months
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
        
        # Listings by type
        for_sale = db.query(Listing).filter(Listing.listing_type == "sale").count()
        for_rent = db.query(Listing).filter(Listing.listing_type == "rent").count()
        
        # Listings by property type
        property_types = {}
        for p_type in ["house", "apartment", "villa", "condo", "commercial"]:
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
        # Calculate revenue from subscription payments
        total_revenue = 84500  # Mock data for now
        this_month = 25000
        last_month = 22000
        
        # Revenue by month (last 6 months)
        revenue_trend = []
        for i in range(5, -1, -1):
            month_date = datetime.utcnow() - timedelta(days=30 * i)
            revenue_trend.append({
                "month": month_date.strftime("%b"),
                "revenue": 15000 + (i * 2000)
            })
        
        return {
            "total": total_revenue,
            "this_month": this_month,
            "last_month": last_month,
            "trend": revenue_trend
        }
    except Exception as e:
        print(f"Error in revenue stats: {e}")
        return {"total": 0, "this_month": 0, "last_month": 0, "trend": []}

@router.get("/recent-activities")
async def get_recent_activities(
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Get recent platform activities"""
    try:
        activities = []
        
        # Recent user registrations
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
        
        # Recent listings
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
        
        # Sort by created_at
        activities.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        return activities[:limit]
    except Exception as e:
        print(f"Error in recent activities: {e}")
        return []
    
