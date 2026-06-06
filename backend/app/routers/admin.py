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


# ============ USER MANAGEMENT ENDPOINTS ============
@router.get("/users")
async def get_all_users(
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    status: Optional[str] = None,
    role: Optional[str] = None,
    limit: int = 200,
    offset: int = 0
):
    """Get all users for admin panel"""
    try:
        print(f"📊 Fetching users - search: {search}, status: {status}, role: {role}")
        
        query = db.query(User).filter(User.role_type != 'admin')
        
        if search:
            query = query.filter(
                (User.email.ilike(f"%{search}%")) | 
                (User.username.ilike(f"%{search}%")) |
                (User.full_name.ilike(f"%{search}%"))
            )
        
        if status and status != "all":
            if status == "active":
                query = query.filter(User.status == "active")
            elif status == "pending":
                query = query.filter(User.status == "pending")
            elif status == "suspended":
                query = query.filter(User.status == "suspended")
        
        if role and role != "all":
            query = query.filter(User.role_type == role)
        
        total = query.count()
        users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
        
        result = []
        for user in users:
            result.append({
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "phone": user.phone,
                "role_type": user.role_type,
                "status": user.status,
                "is_active": user.is_active,
                "is_verified": user.is_verified,
                "is_activated": user.is_activated,
                "payment_approved": user.payment_approved,
                "has_active_subscription": user.has_active_subscription,
                "subscription_plan": user.subscription_plan,
                "subscription_end_date": user.subscription_end_date.isoformat() if user.subscription_end_date else None,
                "seller_documents_submitted": getattr(user, 'seller_documents_submitted', False),
                "landlord_documents_submitted": getattr(user, 'landlord_documents_submitted', False),
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "last_login": user.last_login.isoformat() if user.last_login else None,
                "avatar_url": user.avatar_url,
                "city": user.city,
                "region": user.region
            })
        
        print(f"✅ Found {len(result)} users")
        
        return {
            "success": True,
            "total": total,
            "users": result
        }
        
    except Exception as e:
        print(f"Error getting users: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e), "users": [], "total": 0}


@router.get("/users/stats")
async def get_user_stats(
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get user statistics for admin dashboard"""
    try:
        all_users = db.query(User).filter(User.role_type != 'admin').all()
        
        total = len(all_users)
        
        fully_active = len([u for u in all_users if u.is_verified == True and u.payment_approved == True])
        doc_approved_waiting = len([u for u in all_users if u.is_verified == True and u.payment_approved != True])
        docs_submitted = len([u for u in all_users if (getattr(u, 'seller_documents_submitted', False) or getattr(u, 'landlord_documents_submitted', False)) and u.is_verified != True])
        no_docs = len([u for u in all_users if not (getattr(u, 'seller_documents_submitted', False) or getattr(u, 'landlord_documents_submitted', False)) and u.is_verified != True])
        suspended = len([u for u in all_users if u.status == 'suspended'])
        
        buyers = len([u for u in all_users if u.role_type == 'buyer'])
        sellers = len([u for u in all_users if u.role_type == 'seller'])
        landlords = len([u for u in all_users if u.role_type == 'landlord'])
        dual = len([u for u in all_users if u.role_type == 'dual'])
        users_count = len([u for u in all_users if u.role_type == 'user'])
        
        return {
            "success": True,
            "total": total,
            "fullyActive": fully_active,
            "docApprovedWaitingPayment": doc_approved_waiting,
            "docsSubmittedPending": docs_submitted,
            "noDocuments": no_docs,
            "suspended": suspended,
            "buyers": buyers,
            "sellers": sellers,
            "landlords": landlords,
            "dual": dual,
            "users": users_count
        }
        
    except Exception as e:
        print(f"Error getting user stats: {e}")
        return {"success": False, "error": str(e)}


@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    user_data: UserUpdateRequest,
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update user information"""
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
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating user: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/{user_id}/suspend")
async def suspend_user(
    user_id: int,
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Suspend a user - completely block access"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot suspend your own account")
        
        # Block user completely
        user.status = "suspended"
        user.is_active = False
        user.is_activated = False
        user.can_create_listings = False
        user.has_active_subscription = False
        user.payment_approved = False
        
        # Clear any active sessions by updating last_login
        user.last_login = None
        
        db.commit()
        
        print(f"✅ User {user.email} has been SUSPENDED - completely blocked")
        
        return {"success": True, "message": f"User {user.email} suspended successfully"}
        
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
    """Activate a suspended user"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Restore user access
        user.status = "active"
        user.is_active = True
        user.is_activated = True
        user.can_create_listings = True
        user.has_active_subscription = True
        user.payment_approved = True
        
        db.commit()
        
        print(f"✅ User {user.email} has been ACTIVATED - access restored")
        
        return {"success": True, "message": f"User {user.email} activated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error activating user: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a user (admin only)"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.role_type == 'admin':
            raise HTTPException(status_code=403, detail="Cannot delete admin users")
        
        if user.id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
        db.delete(user)
        db.commit()
        
        return {"success": True, "message": f"User {user.email} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting user: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


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
        
        pending_activations = db.query(ActivationRequest).filter(ActivationRequest.status == "documents_pending").count()
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


@router.get("/pending-users")
async def get_pending_users(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get users pending admin approval (sellers, landlords, dual)"""
    try:
        pending_users = db.query(User).filter(
            User.is_activated == False,
            User.role_type.in_(['seller', 'landlord', 'dual']),
            User.status != 'active'
        ).all()
        
        return [
            {
                "id": u.id,
                "email": u.email,
                "username": u.username,
                "full_name": u.full_name,
                "phone": u.phone,
                "role_type": u.role_type,
                "status": u.status,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "avatar_url": u.avatar_url
            }
            for u in pending_users
        ]
    except Exception as e:
        print(f"Error getting pending users: {e}")
        return []


print("✅ Admin router loaded successfully with suspend/activate user management endpoints!")