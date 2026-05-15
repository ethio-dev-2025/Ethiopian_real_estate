from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, text
from typing import Optional, List
import json
import os
import uuid
import shutil
from datetime import datetime
from ..database import get_db, engine
from ..models import User, Listing
from .auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

UPLOAD_DIR = "uploads/listings"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ListingCreate(BaseModel):
    title: str
    property_type: str = "house"
    price: float
    bedrooms: int = 0
    bathrooms: int = 0
    sqft: float = 0
    year_built: Optional[int] = None
    address: str
    city: str
    region: Optional[str] = None
    sub_city: Optional[str] = None
    kebele: Optional[str] = None
    zip_code: Optional[str] = None
    description: Optional[str] = None
    images: Optional[str] = None
    cover_image: Optional[str] = None
    amenities: Optional[str] = None
    listing_type: str = "sale"
    phone_number: Optional[str] = None
    email: Optional[str] = None
    status: str = "draft"
    is_draft: bool = True

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    property_type: Optional[str] = None
    price: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    sqft: Optional[float] = None
    year_built: Optional[int] = None
    address: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    sub_city: Optional[str] = None
    kebele: Optional[str] = None
    description: Optional[str] = None
    images: Optional[str] = None
    cover_image: Optional[str] = None
    amenities: Optional[str] = None
    listing_type: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None
    is_draft: Optional[bool] = None


# ============ FAST PUBLIC ENDPOINT WITH RAW SQL (NO ORM DELAY) ============
@router.get("/public-fast")
async def get_public_listings_fast(
    limit: int = Query(12, description="Number of listings to return"),
    offset: int = Query(0, description="Pagination offset"),
    listing_type: Optional[str] = Query(None, description="Filter by 'sale' or 'rent'")
):
    """
    Super fast public endpoint using raw SQL
    """
    try:
        print(f"📡 Fast public listings request: type={listing_type}, limit={limit}, offset={offset}")
        
        # Build SQL query
        sql = """
            SELECT 
                l.id, l.title, l.description, l.price, l.listing_type, 
                l.property_type, l.bedrooms, l.bathrooms, l.sqft, l.year_built,
                l.address, l.city, l.region, l.sub_city, l.kebele,
                l.images, l.cover_image, l.amenities, l.phone_number, l.email,
                l.views_count, l.featured, l.created_at,
                u.id as owner_id, u.full_name as owner_name, u.phone as owner_phone
            FROM listings l
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.is_draft = false AND l.status = 'active'
        """
        
        if listing_type and listing_type in ['sale', 'rent']:
            sql += f" AND l.listing_type = '{listing_type}'"
        
        sql += " ORDER BY l.created_at DESC LIMIT :limit OFFSET :offset"
        
        # Get total count
        count_sql = """
            SELECT COUNT(*) FROM listings 
            WHERE is_draft = false AND status = 'active'
        """
        if listing_type and listing_type in ['sale', 'rent']:
            count_sql += f" AND listing_type = '{listing_type}'"
        
        with engine.connect() as conn:
            # Get total count
            total_result = conn.execute(text(count_sql))
            total = total_result.scalar()
            
            # Get listings
            result = conn.execute(text(sql), {"limit": limit, "offset": offset})
            rows = result.fetchall()
            
            listings = []
            for row in rows:
                # Parse images JSON
                images = []
                if row[15]:  # images column
                    try:
                        images = json.loads(row[15]) if isinstance(row[15], str) else row[15]
                    except:
                        images = []
                
                # Parse amenities JSON
                amenities = []
                if row[17]:  # amenities column
                    try:
                        amenities = json.loads(row[17]) if isinstance(row[17], str) else row[17]
                    except:
                        amenities = []
                
                listings.append({
                    "id": row[0],
                    "title": row[1],
                    "description": row[2],
                    "price": float(row[3]) if row[3] else 0,
                    "listing_type": row[4],
                    "property_type": row[5],
                    "bedrooms": row[6] or 0,
                    "bathrooms": row[7] or 0,
                    "sqft": float(row[8]) if row[8] else 0,
                    "year_built": row[9],
                    "address": row[10],
                    "city": row[11],
                    "region": row[12],
                    "sub_city": row[13],
                    "kebele": row[14],
                    "images": images,
                    "cover_image": row[16],
                    "amenities": amenities,
                    "phone_number": row[18],
                    "email": row[19],
                    "views_count": row[20] or 0,
                    "featured": row[21] or False,
                    "created_at": row[22].isoformat() if row[22] else None,
                    "owner": {
                        "id": row[23],
                        "name": row[24],
                        "phone": row[25]
                    } if row[23] else None
                })
            
            print(f"✅ Returning {len(listings)} fast public listings")
            
            return {
                "success": True,
                "total": total,
                "listings": listings,
                "has_more": len(listings) < total
            }
        
    except Exception as e:
        print(f"❌ Error fetching fast public listings: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "total": 0,
            "listings": []
        }


# ============ PUBLIC ENDPOINT FOR HOME PAGE ============
@router.get("/public")
async def get_public_listings(
    db: Session = Depends(get_db),
    limit: int = Query(12, description="Number of listings to return"),
    offset: int = Query(0, description="Pagination offset"),
    listing_type: Optional[str] = Query(None, description="Filter by 'sale' or 'rent'")
):
    """
    Public endpoint for home page - returns active, published listings
    """
    try:
        print(f"📡 Public listings request: type={listing_type}, limit={limit}, offset={offset}")
        
        query = db.query(Listing).filter(
            Listing.is_draft == False,
            Listing.status == "active"
        )
        
        if listing_type and listing_type in ['sale', 'rent']:
            query = query.filter(Listing.listing_type == listing_type)
        
        total = query.count()
        print(f"📊 Total active listings found: {total}")
        
        listings = query.order_by(desc(Listing.created_at)).offset(offset).limit(limit).all()
        
        result = []
        for listing in listings:
            images = []
            if listing.images:
                try:
                    if isinstance(listing.images, str):
                        images = json.loads(listing.images)
                    elif isinstance(listing.images, list):
                        images = listing.images
                except:
                    images = []
            
            amenities = []
            if listing.amenities:
                try:
                    if isinstance(listing.amenities, str):
                        amenities = json.loads(listing.amenities)
                    elif isinstance(listing.amenities, list):
                        amenities = listing.amenities
                except:
                    amenities = []
            
            owner = db.query(User).filter(User.id == listing.user_id).first()
            
            result.append({
                "id": listing.id,
                "title": listing.title,
                "description": listing.description,
                "price": listing.price,
                "listing_type": listing.listing_type,
                "property_type": listing.property_type,
                "bedrooms": listing.bedrooms,
                "bathrooms": listing.bathrooms,
                "sqft": listing.sqft,
                "year_built": listing.year_built,
                "address": listing.address,
                "city": listing.city,
                "region": listing.region,
                "sub_city": listing.sub_city,
                "kebele": listing.kebele,
                "images": images,
                "cover_image": listing.cover_image,
                "amenities": amenities,
                "phone_number": listing.phone_number,
                "email": listing.email,
                "views_count": listing.views_count,
                "featured": listing.featured,
                "created_at": listing.created_at.isoformat() if listing.created_at else None,
                "owner": {
                    "id": owner.id if owner else None,
                    "name": owner.full_name or owner.username if owner else None,
                    "phone": owner.phone if owner else None
                } if owner else None
            })
        
        print(f"✅ Returning {len(result)} public listings")
        
        return {
            "success": True,
            "total": total,
            "listings": result,
            "has_more": len(result) < total
        }
        
    except Exception as e:
        print(f"❌ Error fetching public listings: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "total": 0,
            "listings": []
        }


# ============ PUBLIC ENDPOINT FOR SINGLE LISTING ============
@router.get("/public/{listing_id}")
async def get_public_listing(
    listing_id: int,
    db: Session = Depends(get_db)
):
    try:
        listing = db.query(Listing).filter(
            Listing.id == listing_id,
            Listing.is_draft == False,
            Listing.status == "active"
        ).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        listing.views_count = (listing.views_count or 0) + 1
        db.commit()
        
        images = []
        if listing.images:
            try:
                if isinstance(listing.images, str):
                    images = json.loads(listing.images)
                elif isinstance(listing.images, list):
                    images = listing.images
            except:
                images = []
        
        amenities = []
        if listing.amenities:
            try:
                if isinstance(listing.amenities, str):
                    amenities = json.loads(listing.amenities)
                elif isinstance(listing.amenities, list):
                    amenities = listing.amenities
            except:
                amenities = []
        
        owner = db.query(User).filter(User.id == listing.user_id).first()
        
        return {
            "id": listing.id,
            "title": listing.title,
            "description": listing.description,
            "price": listing.price,
            "listing_type": listing.listing_type,
            "property_type": listing.property_type,
            "bedrooms": listing.bedrooms,
            "bathrooms": listing.bathrooms,
            "sqft": listing.sqft,
            "year_built": listing.year_built,
            "address": listing.address,
            "city": listing.city,
            "region": listing.region,
            "sub_city": listing.sub_city,
            "kebele": listing.kebele,
            "images": images,
            "cover_image": listing.cover_image,
            "amenities": amenities,
            "phone_number": listing.phone_number,
            "email": listing.email,
            "views_count": listing.views_count,
            "featured": listing.featured,
            "created_at": listing.created_at.isoformat() if listing.created_at else None,
            "owner": {
                "id": owner.id if owner else None,
                "name": owner.full_name or owner.username if owner else None,
                "phone": owner.phone if owner else None,
                "email": owner.email if owner else None
            } if owner else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching public listing: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ GET ALL PUBLIC LISTINGS (alias) ============
@router.get("/")
async def get_all_public_listings(
    db: Session = Depends(get_db),
    limit: int = Query(12, description="Number of listings to return"),
    offset: int = Query(0, description="Pagination offset"),
    listing_type: Optional[str] = Query(None, description="Filter by 'sale' or 'rent'")
):
    return await get_public_listings(db, limit, offset, listing_type)


# ============ IMAGE UPLOAD ============
@router.post("/upload-image")
async def upload_listing_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    try:
        allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max 10MB")
        
        file_extension = file.filename.split('.')[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        user_upload_dir = os.path.join(UPLOAD_DIR, f"user_{current_user.id}")
        os.makedirs(user_upload_dir, exist_ok=True)
        
        file_path = os.path.join(user_upload_dir, unique_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        image_url = f"/uploads/listings/user_{current_user.id}/{unique_filename}"
        
        return {
            "success": True,
            "url": image_url,
            "message": "Image uploaded successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error uploading image: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ CREATE LISTING ============
@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_listing(
    listing_data: ListingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        images_value = None
        if listing_data.images:
            if isinstance(listing_data.images, str):
                images_value = listing_data.images
            elif isinstance(listing_data.images, list):
                images_value = json.dumps(listing_data.images)
        
        amenities_value = None
        if listing_data.amenities:
            if isinstance(listing_data.amenities, str):
                amenities_value = listing_data.amenities
            elif isinstance(listing_data.amenities, list):
                amenities_value = json.dumps(listing_data.amenities)
        
        status_value = "draft" if listing_data.is_draft else "active"
        
        new_listing = Listing(
            title=listing_data.title,
            description=listing_data.description,
            price=listing_data.price,
            listing_type=listing_data.listing_type,
            property_type=listing_data.property_type,
            bedrooms=listing_data.bedrooms,
            bathrooms=listing_data.bathrooms,
            sqft=listing_data.sqft,
            year_built=listing_data.year_built,
            status=status_value,
            is_draft=listing_data.is_draft,
            address=listing_data.address,
            city=listing_data.city,
            region=listing_data.region,
            sub_city=listing_data.sub_city,
            kebele=listing_data.kebele,
            zip_code=listing_data.zip_code,
            images=images_value,
            cover_image=listing_data.cover_image,
            amenities=amenities_value,
            phone_number=listing_data.phone_number,
            email=listing_data.email,
            videos=None,
            documents=None,
            views_count=0,
            featured=False,
            user_id=current_user.id,
            published_at=datetime.utcnow() if not listing_data.is_draft else None,
            created_at=datetime.utcnow()
        )
        
        db.add(new_listing)
        db.commit()
        db.refresh(new_listing)
        
        return {
            "success": True,
            "message": "Listing saved as draft" if listing_data.is_draft else "Listing published successfully",
            "listing_id": new_listing.id,
            "is_draft": new_listing.is_draft,
            "status": new_listing.status
        }
        
    except Exception as e:
        print(f"Error creating listing: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ GET MY LISTINGS ============
@router.get("/my-listings")
async def get_my_listings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    include_drafts: bool = Query(True),
    limit: int = Query(50),
    offset: int = Query(0)
):
    try:
        query = db.query(Listing).filter(Listing.user_id == current_user.id)
        
        if not include_drafts:
            query = query.filter(and_(Listing.is_draft == False, Listing.status == "active"))
        
        total = query.count()
        listings = query.order_by(desc(Listing.created_at)).offset(offset).limit(limit).all()
        
        result = []
        for l in listings:
            images = []
            if l.images:
                try:
                    images = json.loads(l.images) if isinstance(l.images, str) else l.images
                    images = images[:5]
                except:
                    images = []
            
            result.append({
                "id": l.id,
                "title": l.title,
                "listing_type": l.listing_type,
                "status": l.status,
                "price": l.price,
                "description": l.description[:200] if l.description else "",
                "bedrooms": l.bedrooms,
                "bathrooms": l.bathrooms,
                "sqft": l.sqft,
                "year_built": l.year_built,
                "images": images,
                "cover_image": l.cover_image,
                "address": l.address,
                "city": l.city,
                "region": l.region,
                "is_draft": l.is_draft,
                "created_at": l.created_at.isoformat() if l.created_at else None
            })
        
        return {
            "total": total,
            "listings": result,
            "has_more": len(result) < total
        }
        
    except Exception as e:
        print(f"Error fetching listings: {e}")
        return {"total": 0, "listings": [], "has_more": False}


# ============ GET SINGLE LISTING ============
@router.get("/{listing_id}")
async def get_listing(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if listing.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        images = json.loads(listing.images) if listing.images else []
        amenities = json.loads(listing.amenities) if listing.amenities else []
        
        return {
            "id": listing.id,
            "title": listing.title,
            "description": listing.description,
            "price": listing.price,
            "listing_type": listing.listing_type,
            "property_type": listing.property_type,
            "bedrooms": listing.bedrooms,
            "bathrooms": listing.bathrooms,
            "sqft": listing.sqft,
            "year_built": listing.year_built,
            "address": listing.address,
            "city": listing.city,
            "region": listing.region,
            "sub_city": listing.sub_city,
            "kebele": listing.kebele,
            "images": images,
            "cover_image": listing.cover_image,
            "amenities": amenities,
            "phone_number": listing.phone_number,
            "email": listing.email,
            "status": listing.status,
            "is_draft": listing.is_draft,
            "views_count": listing.views_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting listing: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ UPDATE LISTING ============
@router.put("/{listing_id}")
async def update_listing(
    listing_id: int,
    listing_data: ListingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if listing.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        for field, value in listing_data.dict(exclude_unset=True).items():
            setattr(listing, field, value)
        
        listing.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            "success": True,
            "message": "Listing updated successfully",
            "listing_id": listing.id
        }
        
    except Exception as e:
        print(f"Error updating listing: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ DELETE LISTING ============
@router.delete("/{listing_id}")
async def delete_listing(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if listing.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        db.delete(listing)
        db.commit()
        
        return {"success": True, "message": "Listing deleted successfully"}
        
    except Exception as e:
        print(f"Error deleting listing: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============ PUBLISH DRAFT ============
@router.post("/publish/{listing_id}")
async def publish_listing(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if listing.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="You don't own this listing")
        
        listing.is_draft = False
        listing.status = "active"
        listing.published_at = datetime.utcnow()
        listing.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "success": True,
            "message": "Listing published successfully",
            "listing_id": listing.id
        }
        
    except Exception as e:
        print(f"Error publishing listing: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))