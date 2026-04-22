import os
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME')
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Simple admin password (in production, use proper auth)
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'dirtplace2024')

logger = logging.getLogger(__name__)

router = APIRouter()

class AdminLogin(BaseModel):
    password: str

class OrderStatusUpdate(BaseModel):
    status: str

def verify_admin(authorization: Optional[str] = Header(None)):
    """
    Simple admin verification
    """
    if not authorization or authorization != f"Bearer {ADMIN_PASSWORD}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True

@router.post("/login")
async def admin_login(credentials: AdminLogin):
    """
    Admin login
    """
    if credentials.password == ADMIN_PASSWORD:
        return {
            "success": True,
            "token": ADMIN_PASSWORD,
            "message": "Login successful"
        }
    raise HTTPException(status_code=401, detail="Invalid password")

@router.get("/orders", dependencies=[Depends(verify_admin)])
async def get_all_orders(
    status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """
    Get all orders with optional filtering
    """
    try:
        query = {}
        if status:
            query["status"] = status
        
        orders = await db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        total = await db.orders.count_documents(query)
        
        # Convert ObjectId to string
        for order in orders:
            order["_id"] = str(order["_id"])
        
        return {
            "orders": orders,
            "total": total,
            "limit": limit,
            "skip": skip
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch orders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders/{order_id}", dependencies=[Depends(verify_admin)])
async def get_order_details(order_id: str):
    """
    Get specific order details
    """
    try:
        # Validate ObjectId format
        if not ObjectId.is_valid(order_id):
            raise HTTPException(status_code=400, detail="Invalid order ID format")
        
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order["_id"] = str(order["_id"])
        return order
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/orders/{order_id}/status", dependencies=[Depends(verify_admin)])
async def update_order_status(order_id: str, update: OrderStatusUpdate):
    """
    Update order status
    """
    try:
        # Validate ObjectId format
        if not ObjectId.is_valid(order_id):
            raise HTTPException(status_code=400, detail="Invalid order ID format")
        
        valid_statuses = ["pending_payment", "processing", "in_delivery", "delivered", "cancelled"]
        if update.status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        result = await db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {
                "$set": {
                    "status": update.status,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return {"success": True, "message": "Order status updated"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", dependencies=[Depends(verify_admin)])
async def get_dashboard_stats():
    """
    Get admin dashboard statistics
    """
    try:
        # Total orders
        total_orders = await db.orders.count_documents({})
        
        # Orders by status
        pending = await db.orders.count_documents({"status": "pending_payment"})
        processing = await db.orders.count_documents({"status": "processing"})
        in_delivery = await db.orders.count_documents({"status": "in_delivery"})
        delivered = await db.orders.count_documents({"status": "delivered"})
        
        # Total revenue (paid orders only)
        pipeline = [
            {"$match": {"payment_status": "paid"}},
            {"$group": {
                "_id": None,
                "total_revenue": {"$sum": "$pricing.total"}
            }}
        ]
        revenue_result = await db.orders.aggregate(pipeline).to_list(1)
        total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
        
        # Recent orders
        recent_orders = await db.orders.find().sort("created_at", -1).limit(5).to_list(5)
        for order in recent_orders:
            order["_id"] = str(order["_id"])
        
        return {
            "total_orders": total_orders,
            "orders_by_status": {
                "pending_payment": pending,
                "processing": processing,
                "in_delivery": in_delivery,
                "delivered": delivered
            },
            "total_revenue": round(total_revenue, 2),
            "recent_orders": recent_orders
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search", dependencies=[Depends(verify_admin)])
async def search_orders(q: str):
    """
    Search orders by order number, customer name, or email
    """
    try:
        query = {
            "$or": [
                {"order_number": {"$regex": q, "$options": "i"}},
                {"customer.name": {"$regex": q, "$options": "i"}},
                {"customer.email": {"$regex": q, "$options": "i"}}
            ]
        }
        
        orders = await db.orders.find(query).sort("created_at", -1).limit(20).to_list(20)
        
        for order in orders:
            order["_id"] = str(order["_id"])
        
        return {"results": orders}
        
    except Exception as e:
        logger.error(f"Search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== MATERIALS MANAGEMENT ==============

class MaterialCreate(BaseModel):
    name: str
    price_per_unit: float
    unit_type: str
    min_order: int
    stock_quantity: int
    image_url: Optional[str] = ""
    description: Optional[str] = ""

class MaterialUpdate(BaseModel):
    name: str
    price_per_unit: float
    unit_type: str
    min_order: int
    stock_quantity: Optional[int] = None
    image_url: Optional[str] = ""
    description: Optional[str] = ""

class MaterialPricing(BaseModel):
    material_id: str
    name: str
    price_per_cubic_yard: float
    min_order: int

@router.get("/pricing", dependencies=[Depends(verify_admin)])
async def get_all_pricing():
    """
    Get all material pricing
    """
    try:
        pricing = await db.material_pricing.find().to_list(100)
        
        # If no pricing exists, initialize with defaults
        if not pricing:
            default_pricing = [
                {"material_id": "1", "name": "Topsoil", "price_per_cubic_yard": 45.00, "min_order": 1},
                {"material_id": "2", "name": "Gravel", "price_per_cubic_yard": 55.00, "min_order": 2},
                {"material_id": "3", "name": "Sand", "price_per_cubic_yard": 40.00, "min_order": 1},
                {"material_id": "4", "name": "Road Base", "price_per_cubic_yard": 50.00, "min_order": 2},
                {"material_id": "5", "name": "Mulch", "price_per_cubic_yard": 35.00, "min_order": 1},
                {"material_id": "6", "name": "Decorative Rock", "price_per_cubic_yard": 75.00, "min_order": 1},
            ]
            await db.material_pricing.insert_many(default_pricing)
            pricing = await db.material_pricing.find().to_list(100)
        
        for item in pricing:
            item["_id"] = str(item["_id"])
        
        return {"pricing": pricing}
        
    except Exception as e:
        logger.error(f"Failed to fetch pricing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/pricing/{material_id}", dependencies=[Depends(verify_admin)])
async def update_material_pricing(material_id: str, pricing: MaterialPricing):
    """
    Update pricing for a specific material (legacy endpoint)
    """
    try:
        result = await db.material_pricing.update_one(
            {"material_id": material_id},
            {
                "$set": {
                    "price_per_cubic_yard": pricing.price_per_cubic_yard,
                    "min_order": pricing.min_order,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Material not found")
        
        return {"success": True, "message": "Pricing updated successfully"}
        
    except Exception as e:
        logger.error(f"Failed to update pricing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# New Material Management Endpoints

@router.post("/materials", dependencies=[Depends(verify_admin)])
async def create_material(material: MaterialCreate):
    """
    Create a new material
    """
    try:
        # Generate new material_id
        existing_materials = await db.material_pricing.find().sort("material_id", -1).limit(1).to_list(1)
        if existing_materials:
            last_id = int(existing_materials[0]["material_id"])
            new_id = str(last_id + 1)
        else:
            new_id = "1"
        
        material_data = {
            "material_id": new_id,
            "name": material.name,
            "price_per_unit": material.price_per_unit,
            "unit_type": material.unit_type,
            "min_order": material.min_order,
            "stock_quantity": material.stock_quantity,
            "image_url": material.image_url,
            "description": material.description,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.material_pricing.insert_one(material_data)
        
        return {"success": True, "message": "Material created successfully", "material_id": new_id}
        
    except Exception as e:
        logger.error(f"Failed to create material: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/materials/{material_id}", dependencies=[Depends(verify_admin)])
async def update_material(material_id: str, material: MaterialUpdate):
    """
    Update material details including inventory
    """
    try:
        update_data = {
            "name": material.name,
            "price_per_unit": material.price_per_unit,
            "unit_type": material.unit_type,
            "min_order": material.min_order,
            "image_url": material.image_url,
            "description": material.description,
            "updated_at": datetime.utcnow()
        }
        
        if material.stock_quantity is not None:
            update_data["stock_quantity"] = material.stock_quantity
        
        result = await db.material_pricing.update_one(
            {"material_id": material_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Material not found")
        
        return {"success": True, "message": "Material updated successfully"}
        
    except Exception as e:
        logger.error(f"Failed to update material: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/materials/{material_id}", dependencies=[Depends(verify_admin)])
async def delete_material(material_id: str):
    """
    Delete a material
    """
    try:
        result = await db.material_pricing.delete_one({"material_id": material_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Material not found")
        
        return {"success": True, "message": "Material deleted successfully"}
        
    except Exception as e:
        logger.error(f"Failed to delete material: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/inventory", dependencies=[Depends(verify_admin)])
async def get_inventory():
    """
    Get inventory status for all materials
    """
    try:
        materials = await db.material_pricing.find().to_list(100)
        
        inventory = []
        for material in materials:
            material["_id"] = str(material["_id"])
            stock = material.get("stock_quantity", 0)
            
            # Determine stock status
            if stock == 0:
                status = "out_of_stock"
            elif stock < 20:
                status = "low_stock"
            else:
                status = "in_stock"
            
            material["stock_status"] = status
            inventory.append(material)
        
        return {"inventory": inventory}
        
    except Exception as e:
        logger.error(f"Failed to fetch inventory: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Site Settings

class HeroImageUpdate(BaseModel):
    hero_image_url: str

@router.get("/settings", dependencies=[Depends(verify_admin)])
async def get_site_settings():
    """
    Get site settings
    """
    try:
        settings = await db.site_settings.find_one({"setting_type": "general"})
        if not settings:
            # Initialize default settings
            default_settings = {
                "setting_type": "general",
                "hero_image_url": "",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.site_settings.insert_one(default_settings)
            settings = default_settings
        
        settings["_id"] = str(settings["_id"])
        return settings
        
    except Exception as e:
        logger.error(f"Failed to fetch settings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/settings/hero-image", dependencies=[Depends(verify_admin)])
async def update_hero_image(update: HeroImageUpdate):
    """
    Update hero image URL
    """
    try:
        result = await db.site_settings.update_one(
            {"setting_type": "general"},
            {
                "$set": {
                    "hero_image_url": update.hero_image_url,
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        return {"success": True, "message": "Hero image updated successfully"}
        
    except Exception as e:
        logger.error(f"Failed to update hero image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/delivery-fees", dependencies=[Depends(verify_admin)])
async def get_delivery_fees():
    """
    Get delivery fee structure
    """
    try:
        fees = await db.delivery_fees.find().to_list(100)
        
        # Initialize if not exists
        if not fees:
            default_fees = [
                {"zip_code": "78006", "fee": 0.00, "area": "Boerne"},
                {"zip_code": "78015", "fee": 15.00, "area": "Boerne Area"},
                {"zip_code": "78070", "fee": 20.00, "area": "Fair Oaks Ranch"},
                {"zip_code": "78163", "fee": 25.00, "area": "Comfort"},
                {"zip_code": "78255", "fee": 30.00, "area": "Leon Springs"},
                {"zip_code": "default", "fee": 40.00, "area": "Extended Area"}
            ]
            await db.delivery_fees.insert_many(default_fees)
            fees = await db.delivery_fees.find().to_list(100)
        
        for fee in fees:
            fee["_id"] = str(fee["_id"])
        
        return {"delivery_fees": fees}
        
    except Exception as e:
        logger.error(f"Failed to fetch delivery fees: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class DeliveryFeeUpdate(BaseModel):
    zip_code: str
    fee: float
    area: str

@router.put("/delivery-fees/{zip_code}", dependencies=[Depends(verify_admin)])
async def update_delivery_fee(zip_code: str, fee_update: DeliveryFeeUpdate):
    """
    Update delivery fee for a ZIP code
    """
    try:
        result = await db.delivery_fees.update_one(
            {"zip_code": zip_code},
            {
                "$set": {
                    "fee": fee_update.fee,
                    "area": fee_update.area,
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        return {"success": True, "message": "Delivery fee updated successfully"}
        
    except Exception as e:
        logger.error(f"Failed to update delivery fee: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
