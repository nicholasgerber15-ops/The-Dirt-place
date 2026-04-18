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
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order["_id"] = str(order["_id"])
        return order
        
    except Exception as e:
        logger.error(f"Failed to fetch order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/orders/{order_id}/status", dependencies=[Depends(verify_admin)])
async def update_order_status(order_id: str, update: OrderStatusUpdate):
    """
    Update order status
    """
    try:
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
