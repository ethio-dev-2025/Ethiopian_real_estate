# backend/app/routers/transactions.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from ..database import get_db
from ..models import User, Listing, Transaction
from .auth import get_current_user

router = APIRouter()

# Pydantic models
class MarkAsSoldRequest(BaseModel):
    buyer_id: int
    amount: float
    payment_reference: Optional[str] = None

class MarkAsRentedRequest(BaseModel):
    buyer_id: int
    monthly_rent: float
    rental_duration_months: int = 12
    payment_reference: Optional[str] = None


# ============ MARK PROPERTY AS SOLD ============
@router.post("/mark-sold/{listing_id}")
async def mark_as_sold(
    listing_id: int,
    request: MarkAsSoldRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Seller marks their property as sold"""
    try:
        # Get the listing
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Check if user is the owner
        if listing.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="You don't own this listing")
        
        # Check if already sold or rented
        if hasattr(listing, 'listing_status'):
            if listing.listing_status == "sold":
                raise HTTPException(status_code=400, detail="Property already marked as sold")
            if listing.listing_status == "rented":
                raise HTTPException(status_code=400, detail="Property already marked as rented")
        
        # Get buyer
        buyer = db.query(User).filter(User.id == request.buyer_id).first()
        if not buyer:
            raise HTTPException(status_code=404, detail="Buyer not found")
        
        # Create transaction record
        transaction = Transaction(
            listing_id=listing_id,
            seller_id=current_user.id,
            buyer_id=request.buyer_id,
            transaction_type="sale",
            amount=request.amount,
            status="completed",
            payment_reference=request.payment_reference,
            completed_date=datetime.utcnow()
        )
        db.add(transaction)
        db.flush()
        
        # Update listing status
        listing.listing_status = "sold"
        listing.sold_date = datetime.utcnow()
        listing.sold_to_user_id = request.buyer_id
        listing.transaction_id = transaction.id
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Property marked as sold to {buyer.full_name or buyer.username}",
            "transaction_id": transaction.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error marking as sold: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ MARK PROPERTY AS RENTED ============
@router.post("/mark-rented/{listing_id}")
async def mark_as_rented(
    listing_id: int,
    request: MarkAsRentedRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Seller marks their property as rented"""
    try:
        # Get the listing
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Check if user is the owner
        if listing.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="You don't own this listing")
        
        # Check if already sold or rented
        if hasattr(listing, 'listing_status'):
            if listing.listing_status == "sold":
                raise HTTPException(status_code=400, detail="Property already marked as sold")
            if listing.listing_status == "rented":
                raise HTTPException(status_code=400, detail="Property already marked as rented")
        
        # Get renter
        renter = db.query(User).filter(User.id == request.buyer_id).first()
        if not renter:
            raise HTTPException(status_code=404, detail="Renter not found")
        
        # Calculate dates
        start_date = datetime.utcnow()
        from dateutil.relativedelta import relativedelta
        end_date = datetime.utcnow() + relativedelta(months=request.rental_duration_months)
        
        # Create transaction record
        transaction = Transaction(
            listing_id=listing_id,
            seller_id=current_user.id,
            buyer_id=request.buyer_id,
            transaction_type="rent",
            amount=request.monthly_rent,
            status="completed",
            rental_duration_months=request.rental_duration_months,
            rental_start_date=start_date,
            rental_end_date=end_date,
            payment_reference=request.payment_reference,
            completed_date=datetime.utcnow()
        )
        db.add(transaction)
        db.flush()
        
        # Update listing status
        listing.listing_status = "rented"
        listing.sold_date = datetime.utcnow()
        listing.sold_to_user_id = request.buyer_id
        listing.transaction_id = transaction.id
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Property marked as rented to {renter.full_name or renter.username}",
            "transaction_id": transaction.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error marking as rented: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ GET MY TRANSACTIONS ============
@router.get("/my-transactions")
async def get_my_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    """Get all transactions for the current user (as seller)"""
    try:
        transactions = db.query(Transaction).filter(
            Transaction.seller_id == current_user.id
        ).order_by(desc(Transaction.created_at)).offset(offset).limit(limit).all()
        
        result = []
        for tx in transactions:
            listing = db.query(Listing).filter(Listing.id == tx.listing_id).first()
            buyer = db.query(User).filter(User.id == tx.buyer_id).first()
            
            result.append({
                "id": tx.id,
                "listing": {
                    "id": listing.id if listing else None,
                    "title": listing.title if listing else "Unknown",
                    "price": listing.price if listing else 0
                },
                "buyer": {
                    "id": buyer.id if buyer else None,
                    "name": buyer.full_name or buyer.username if buyer else "Unknown",
                    "email": buyer.email if buyer else "Unknown"
                },
                "transaction_type": tx.transaction_type,
                "amount": tx.amount,
                "status": tx.status,
                "rental_duration_months": tx.rental_duration_months,
                "transaction_date": tx.transaction_date.isoformat() if tx.transaction_date else None,
                "completed_date": tx.completed_date.isoformat() if tx.completed_date else None
            })
        
        return {
            "success": True,
            "transactions": result,
            "total": len(result)
        }
        
    except Exception as e:
        print(f"Error getting transactions: {e}")
        return {"success": False, "transactions": [], "total": 0}