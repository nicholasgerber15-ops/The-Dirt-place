# UNIVERSAL NRG-CO HEADER BLOCK
# Use this exact banner at the top of source files. License/covenant terms still apply.
# 
################################################################
#                                                              #
#                ⚡  N R G - C O  ⚡                          #
#                                                              #
#    CRITICAL ASSET — CLOSED SOURCE / CONFIDENTIAL              #
#    PROPRIETARY / UNDER DEVELOPMENT / SECRET                   #
#                                                              #
################################################################
import os
import uuid
import csv
import io
import json
import asyncio
import logging
import hashlib
import secrets
import time
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Header, Request
from pydantic import BaseModel
from dotenv import load_dotenv
from backend.data.products import PRODUCTS
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# MongoDB connection with lazy initialization
_db = None
_client = None

async def get_database():
    global _db, _client
    if os.environ.get('FORCE_DEMO'):
        return None
    if _db is not None:
        return _db
    
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    if not mongo_url or not db_name:
        logger.warning("MongoDB not configured - running in demo mode")
        return None
    
    try:
        _client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        await _client.admin.command('ping')
        _db = _client[db_name]
        logger.info(f"Connected to MongoDB: {db_name}")
        return _db
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        _db = None
        _client = None
        os.environ['FORCE_DEMO'] = 'true'
        return None

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')

router = APIRouter()

class AdminLogin(BaseModel):
    password: str

class OrderStatusUpdate(BaseModel):
    status: str

def verify_admin(authorization: Optional[str] = Header(None)):
    """
    Simple admin verification — checks stored hash first, then env var.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    stored_hash = _get_stored_password_hash()
    if stored_hash:
        if token != stored_hash:
            raise HTTPException(status_code=401, detail="Unauthorized")
        return True
    if not ADMIN_PASSWORD:
        raise HTTPException(status_code=503, detail="Admin authentication is not configured")
    if token != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True

@router.post("/login")
async def admin_login(credentials: AdminLogin):
    """
    Admin login — checks stored hash first, then env var.
    """
    stored_hash = _get_stored_password_hash()
    if stored_hash:
        if _hash_password(credentials.password) == stored_hash:
            return {"success": True, "token": stored_hash, "message": "Login successful"}
        raise HTTPException(status_code=401, detail="Invalid password")
    if not ADMIN_PASSWORD:
        raise HTTPException(status_code=503, detail="Admin authentication is not configured")
    if credentials.password == ADMIN_PASSWORD:
        return {
            "success": True,
            "token": ADMIN_PASSWORD,
            "message": "Login successful",
        }
    raise HTTPException(status_code=401, detail="Invalid password")

# --- Password reset ---
ADMIN_RESET_FILE = ROOT_DIR / "admin_reset.json"
RESET_TOKEN_EXPIRY = 3600  # 1 hour

def _load_reset_tokens():
    if ADMIN_RESET_FILE.exists():
        try:
            return json.loads(ADMIN_RESET_FILE.read_text())
        except Exception:
            return {}
    return {}

def _save_reset_tokens(data):
    ADMIN_RESET_FILE.write_text(json.dumps(data))

def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def _get_stored_password_hash():
    db = asyncio.run(get_database())
    if db is not None:
        try:
            coll = db["admin"]
            doc = coll.find_one({"_id": "password"})
            if doc and "hash" in doc:
                return doc["hash"]
        except Exception:
            pass
    if ADMIN_RESET_FILE.exists():
        try:
            data = json.loads(ADMIN_RESET_FILE.read_text())
            if "password_hash" in data:
                return data["password_hash"]
        except Exception:
            pass
    return None

async def _store_password_hash(password_hash: str):
    db = asyncio.run(get_database())
    if db is not None:
        try:
            coll = db["admin"]
            coll.update_one(
                {"_id": "password"},
                {"$set": {"hash": password_hash, "updated_at": datetime.utcnow().isoformat()}},
                upsert=True,
            )
            return
        except Exception:
            pass
    data = {}
    if ADMIN_RESET_FILE.exists():
        try:
            data = json.loads(ADMIN_RESET_FILE.read_text())
        except Exception:
            pass
    data["password_hash"] = password_hash
    _save_reset_tokens(data)

@router.post("/forgot-password")
async def forgot_password(request: Request):
    """
    Send a password reset link to the admin email.
    """
    try:
        body = await request.json()
    except Exception:
        body = {}
    email = body.get("email", "").strip().lower()
    if email != "thedirtplace@outlook.com":
        return {"success": True, "message": "If that email is registered, a reset link has been sent."}

    token = secrets.token_urlsafe(32)
    tokens = _load_reset_tokens()
    tokens[token] = {
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": datetime.utcnow().timestamp() + RESET_TOKEN_EXPIRY,
        "used": False,
    }
    _save_reset_tokens(tokens)

    reset_link = f"https://theboernedirtplace.com/admin/reset-password?token={token}"
    try:
        import asyncio
        import resend
        resend.api_key = os.environ.get("RESEND_API_KEY")
        sender = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
        params = {
            "from": sender,
            "to": ["thedirtplace@outlook.com"],
            "subject": "Password Reset — The Dirt Place Admin",
            "html": f"<p>Click the link below to reset your admin password:</p><p><a href='{reset_link}'>{reset_link}</a></p><p>This link expires in 1 hour.</p>",
        }
        asyncio.to_thread(resend.Emails.send, params)
    except Exception as e:
        logger.error(f"Failed to send reset email: {e}")

    return {"success": True, "message": "If that email is registered, a reset link has been sent."}

@router.post("/reset-password")
async def reset_password(request: Request):
    """
    Reset admin password with a valid reset token.
    """
    try:
        body = await request.json()
    except Exception:
        body = {}
    token = body.get("token", "").strip()
    new_password = body.get("password", "").strip()

    if not token or not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Invalid token or password too short")

    tokens = _load_reset_tokens()
    token_data = tokens.get(token)
    if not token_data or token_data.get("used"):
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    if datetime.utcnow().timestamp() > token_data.get("expires_at", 0):
        raise HTTPException(status_code=400, detail="Token has expired")

    tokens[token]["used"] = True
    _save_reset_tokens(tokens)

    password_hash = _hash_password(new_password)
    await _store_password_hash(password_hash)

    return {"success": True, "message": "Password reset successfully. You can now log in with your new password."}

@router.post("/reset-password/verify-token")
async def verify_reset_token(request: Request):
    """
    Verify a reset token is valid and not expired.
    """
    try:
        body = await request.json()
    except Exception:
        body = {}
    token = body.get("token", "").strip()
    tokens = _load_reset_tokens()
    token_data = tokens.get(token)
    if not token_data or token_data.get("used"):
        raise HTTPException(status_code=400, detail="Invalid token")
    if datetime.utcnow().timestamp() > token_data.get("expires_at", 0):
        raise HTTPException(status_code=400, detail="Token has expired")
    return {"success": True, "message": "Token is valid"}

# Demo data for offline mode
def get_demo_orders():
    from datetime import datetime, timedelta
    import random
    
    materials = ["Topsoil", "Gravel", "Sand", "Road Base", "Mulch", "Decorative Rock"]
    statuses = ["pending_payment", "processing", "in_delivery", "delivered"]
    names = ["John Smith", "Maria Garcia", "Tom Johnson", "Sarah Williams", "Mike Brown"]
    
    demo_orders = []
    for i in range(5):
        days_ago = random.randint(0, 30)
        demo_orders.append({
            "_id": f"demo_{i+1}",
            "order_number": f"ORD-2024-{1000+i}",
            "customer": {
                "name": names[i],
                "email": names[i].lower().replace(" ", ".") + "@email.com",
                "phone": f"(830) 555-{1000+i:04d}"
            },
            "material": materials[i % len(materials)],
            "quantity": random.randint(1, 10),
            "pricing": {
                "material": random.randint(50, 150),
                "delivery": random.choice([0, 25, 40, 50]),
                "total": random.randint(75, 500)
            },
            "status": statuses[i % len(statuses)],
            "payment_status": "paid" if i > 1 else "pending",
            "created_at": (datetime.now() - timedelta(days=days_ago)).isoformat()
        })
    return demo_orders

def get_demo_pricing():
    result = []
    for p in PRODUCTS:
        price = float(p.get("price_per_unit", 0))
        result.append({
            "material_id": p.get("material_id", ""),
            "name": p.get("name", ""),
            "price_per_unit": price,
            "price_per_cubic_yard": price,
            "unit_type": p.get("unit_type", "each"),
            "category": p.get("category", ""),
            "description": p.get("description", ""),
            "min_order": p.get("min_order", 1),
            "stock_quantity": p.get("stock_quantity", 0),
            "product_details": p.get("product_details", ""),
        })
    return result

DELIVERY_FEE_BASE = float(os.environ.get('DELIVERY_FEE_BASE', '70'))
DELIVERY_FEE_PER_MILE = float(os.environ.get('DELIVERY_FEE_PER_MILE', '5'))

def get_demo_delivery_fees():
    result = []
    areas = [
        {"zip": "78006", "miles": 0, "area_name": "Boerne"},
        {"zip": "78015", "miles": 5, "area_name": "Boerne Area"},
        {"zip": "78070", "miles": 8, "area_name": "Fair Oaks Ranch"},
        {"zip": "78163", "miles": 12, "area_name": "Comfort"},
        {"zip": "78255", "miles": 10, "area_name": "Leon Springs"},
    ]
    for a in areas:
        fee = round(DELIVERY_FEE_BASE + (a["miles"] * DELIVERY_FEE_PER_MILE), 2)
        result.append({
            "zip_code": a["zip"],
            "distance_miles": a["miles"],
            "base_fee": DELIVERY_FEE_BASE,
            "per_mile_rate": DELIVERY_FEE_PER_MILE,
            "fee": fee,
            "area": a["area_name"]
        })
    result.append({
        "zip_code": "default",
        "distance_miles": 15,
        "base_fee": DELIVERY_FEE_BASE,
        "per_mile_rate": DELIVERY_FEE_PER_MILE,
        "fee": round(DELIVERY_FEE_BASE + (15 * DELIVERY_FEE_PER_MILE), 2),
        "area": "Extended Area"
    })
    return result

def get_demo_inventory():
    return [
        {"material_id": "1", "name": "Topsoil", "stock_quantity": 150, "stock_status": "in_stock"},
        {"material_id": "2", "name": "Gravel", "stock_quantity": 200, "stock_status": "in_stock"},
        {"material_id": "3", "name": "Sand", "stock_quantity": 80, "stock_status": "in_stock"},
        {"material_id": "4", "name": "Road Base", "stock_quantity": 15, "stock_status": "low_stock"},
        {"material_id": "5", "name": "Mulch", "stock_quantity": 100, "stock_status": "in_stock"},
        {"material_id": "6", "name": "Decorative Rock", "stock_quantity": 0, "stock_status": "out_of_stock"},
    ]

def get_demo_stats():
    return {
        "total_orders": 5,
        "orders_by_status": {
            "pending_payment": 1,
            "processing": 1,
            "in_delivery": 1,
            "delivered": 2
        },
        "total_revenue": 1250.00,
        "recent_orders": get_demo_orders()
    }

def get_demo_settings():
    return {
        "setting_type": "general",
        "hero_image_url": "",
        "business_hours": {
            "monday": {"open": "8:00", "close": "17:00"},
            "tuesday": {"open": "8:00", "close": "17:00"},
            "wednesday": {"open": "8:00", "close": "17:00"},
            "thursday": {"open": "8:00", "close": "17:00"},
            "friday": {"open": "8:00", "close": "17:00"},
            "saturday": {"open": "8:00", "close": "15:00"},
            "sunday": {"open": "", "close": "", "closed": True}
        }
    }

@router.get("/orders", dependencies=[Depends(verify_admin)])
async def get_all_orders(
    status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """
    Get all orders with optional filtering
    """
    db = await get_database()
    if db is None:
        orders = get_demo_orders()[:limit]
        return {"orders": orders, "total": len(orders), "limit": limit, "skip": skip}
    
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
        logger.error(f"Failed to fetch orders: {str(e)} - returning demo data")
        orders = get_demo_orders()[:limit]
        return {"orders": orders, "total": len(orders), "limit": limit, "skip": skip}

@router.get("/orders/{order_id}", dependencies=[Depends(verify_admin)])
async def get_order_details(order_id: str):
    """
    Get specific order details
    """
    try:
        db = await get_database()
        if db is None:
            demo = get_demo_orders()
            for o in demo:
                if o["_id"] == order_id:
                    return o
            raise HTTPException(status_code=404, detail="Order not found")
        
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
        db = await get_database()
        if db is None:
            return {"success": True, "message": "Order status updated (demo mode)"}
        
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
    db = await get_database()
    if db is None:
        logger.info("MongoDB not available - returning demo stats")
        return get_demo_stats()
    
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
        logger.error(f"Failed to fetch stats: {str(e)} - returning demo data")
        return get_demo_stats()

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
    db = await get_database()
    if db is None:
        return {"pricing": get_demo_pricing()}
    
    try:
        pricing = await db.material_pricing.find().to_list(500)
        
        # If no pricing exists, initialize with defaults
        if not pricing:
            default_pricing = get_demo_pricing()
            await db.material_pricing.insert_many(default_pricing)
            pricing = await db.material_pricing.find().to_list(500)
        
        for item in pricing:
            item["_id"] = str(item["_id"])
        
        return {"pricing": pricing}
        
    except Exception as e:
        logger.error(f"Failed to fetch pricing: {str(e)} - returning demo data")
        return {"pricing": get_demo_pricing()}

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
        db = await get_database()
        if db is None:
            import random
            new_id = str(random.randint(1000, 9999))
            return {"success": True, "message": "Material created (demo mode)", "material_id": new_id}
        
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
        db = await get_database()
        if db is None:
            return {"success": True, "message": "Material updated (demo mode)"}
        
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
        db = await get_database()
        if db is None:
            return {"success": True, "message": "Material deleted (demo mode)"}
        
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
    db = await get_database()
    if db is None:
        return {"inventory": get_demo_inventory()}
    
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
        logger.error(f"Failed to fetch inventory: {str(e)} - returning demo data")
        return {"inventory": get_demo_inventory()}

@router.post("/materials/import-csv", dependencies=[Depends(verify_admin)])
async def import_materials_csv(request: Request):
    """
    Import materials from CSV data
    """
    try:
        data = await request.json()
        csv_text = data.get("csv_text", "")
        if not csv_text:
            raise HTTPException(status_code=400, detail="No CSV data provided")

        reader = csv.DictReader(io.StringIO(csv_text))
        imported = 0
        errors = []

        database = await get_database()
        if not database:
            return {"success": True, "imported": len(list(reader)), "errors": []}

        for row in reader:
            try:
                material_data = {
                    "material_id": row.get("id", str(uuid.uuid4())),
                    "name": row.get("name", ""),
                    "price_per_unit": float(row.get("price_per_unit", row.get("price", 0))),
                    "unit_type": row.get("unit_type", row.get("unit", "cubic yards")),
                    "min_order": int(row.get("min_order", row.get("minOrder", 1))),
                    "stock_quantity": int(row.get("stock_quantity", row.get("stock", 100))),
                    "description": row.get("description", ""),
                    "image_url": row.get("image_url", ""),
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }

                existing = await database.material_pricing.find_one({"material_id": material_data["material_id"]})
                if existing:
                    await database.material_pricing.update_one(
                        {"material_id": material_data["material_id"]},
                        {"$set": {k: v for k, v in material_data.items() if k != "created_at"}}
                    )
                else:
                    await database.material_pricing.insert_one(material_data)

                imported += 1
            except Exception as row_error:
                errors.append(f"Row {imported + 1}: {str(row_error)}")

        return {
            "success": True,
            "imported": imported,
            "errors": errors
        }

    except Exception as e:
        logger.error(f"CSV import failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

UNLOAD_MINUTES = 20
FILLUP_MINUTES = 15
WORK_START_HOUR = 8

def get_delivery_times(distance_miles: float, duration_minutes: float) -> dict:
    one_way_min = duration_minutes or 15
    round_trip_min = one_way_min * 2
    total_min = round_trip_min + UNLOAD_MINUTES + FILLUP_MINUTES
    return {
        "travel_one_way_min": one_way_min,
        "round_trip_min": round_trip_min,
        "unload_min": UNLOAD_MINUTES,
        "fill_up_min": FILLUP_MINUTES,
        "total_min": total_min,
    }

# ============== DRIVER / DELIVERY MANAGEMENT ==============

class DeliveryDateRange(BaseModel):
    start: str
    end: str

@router.get("/driver/deliveries", dependencies=[Depends(verify_admin)])
async def get_driver_deliveries(date: Optional[str] = None):
    """
    Get deliveries for a specific date, or today if no date provided.
    Includes Sunday blocking, 5 PM cut-off, and travel time calculations.
    """
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")

    try:
        dt = datetime.fromisoformat(date)
    except:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    day_name = dt.strftime("%A")
    if dt.weekday() == 6:
        return {
            "date": date, "day": day_name, "closed": True,
            "message": "We are closed on Sundays. No deliveries.",
            "deliveries": []
        }

    from routes.ecommerce import get_distance_google_maps, DIRTPLACE_ADDRESS

    db = await get_database()
    if db is None:
        from datetime import timedelta
        import random
        names = ["John Smith", "Maria Garcia", "Tom Johnson", "Sarah Williams", "Mike Brown"]
        materials = ["Topsoil", "Gravel", "Sand", "Road Base", "Mulch"]
        deliveries = []
        running_min = 0
        for i in range(random.randint(1, 3)):
            travel_min = random.randint(10, 30)
            rt = travel_min * 2
            total = rt + UNLOAD_MINUTES + FILLUP_MINUTES
            running_min += total
            start_time = WORK_START_HOUR + running_min // 60
            end_hour = WORK_START_HOUR + (running_min + total) // 60
            deliveries.append({
                "_id": f"demo_del_{i+1}",
                "order_number": f"ORD-2024-{2000+i}",
                "customer": {"name": names[i], "phone": f"(830) 555-{2000+i:04d}"},
                "delivery": {
                    "address": f"{random.randint(100, 999)} Main St, Boerne, TX",
                    "date": date,
                    "time": f"{random.randint(8, 11)}:00 AM - {random.randint(1, 4)}:00 PM"
                },
                "cart_items": [{"name": random.choice(materials), "quantity": round(random.uniform(1, 8), 1)}],
                "notes": "" if i > 0 else "Gate code: 1234",
                "status": "in_delivery" if i < 2 else "processing",
                "time_estimate": get_delivery_times(travel_min, travel_min),
                "completes_by": f"{end_hour}:00 PM" if end_hour < 12 else f"{end_hour - 12}:00 PM" if end_hour > 12 else "12:00 PM",
                "cut_off_warning": (running_min + total) > (17 - WORK_START_HOUR) * 60
            })
        return {
            "date": date, "day": day_name, "closed": False,
            "cut_off": "5:00 PM", "deliveries": deliveries,
            "total_yards": sum(d["cart_items"][0]["quantity"] for d in deliveries if d["cart_items"]),
            "total_time_min": sum(d.get("time_estimate", {}).get("total_min", 0) for d in deliveries)
        }

    try:
        query = {
            "delivery.date": date,
            "status": {"$in": ["processing", "in_delivery", "scheduled"]}
        }
        deliveries_cursor = db.orders.find(query).sort("delivery.time", 1)
        deliveries = await deliveries_cursor.to_list(100)

        enriched = []
        running_min = 0
        for d in deliveries:
            d["_id"] = str(d["_id"])
            address = d.get("delivery", {}).get("address", "")
            distance, duration, gm_error = None, None, None
            if address:
                distance, duration, gm_error = await get_distance_google_maps(address)

            time_est = get_delivery_times(distance or 15, duration or 15)
            running_min += time_est["total_min"]
            completions_min = WORK_START_HOUR * 60 + running_min
            completes_by_h = completions_min // 60
            completes_by_m = completions_min % 60
            ampm = "AM" if completes_by_h < 12 else "PM"
            display_h = completes_by_h if completes_by_h <= 12 else completes_by_h - 12
            if display_h == 0:
                display_h = 12

            d["time_estimate"] = time_est
            d["completes_by"] = f"{display_h}:{completes_by_m:02d} {ampm}"
            d["cut_off_warning"] = completions_min > 17 * 60
            enriched.append(d)

        total_yards = sum(
            item.get("quantity", 0) for d in enriched for item in d.get("cart_items", [])
        )

        return {
            "date": date, "day": day_name, "closed": False,
            "cut_off": "5:00 PM",
            "deliveries": enriched,
            "total_yards": round(total_yards, 1),
            "total_time_min": sum(d["time_estimate"]["total_min"] for d in enriched)
        }

    except Exception as e:
        logger.error(f"Failed to fetch driver deliveries: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/driver/deliveries/range", dependencies=[Depends(verify_admin)])
async def get_driver_deliveries_range(start: str, end: str):
    """
    Get deliveries within a date range (for calendar view).
    Returns a summary per day with delivery count and total yards.
    """
    try:
        start_dt = datetime.fromisoformat(start)
        end_dt = datetime.fromisoformat(end)
    except:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    db = await get_database()
    if db is None:
        import random
        from datetime import timedelta
        days = []
        current = start_dt
        while current <= end_dt:
            if current.weekday() != 6:  # Skip Sundays
                days.append({
                    "date": current.strftime("%Y-%m-%d"),
                    "day": current.strftime("%A"),
                    "delivery_count": random.randint(0, 3),
                    "total_yards": round(random.uniform(0, 20), 1),
                    "closed": False
                })
            else:
                days.append({
                    "date": current.strftime("%Y-%m-%d"),
                    "day": current.strftime("%A"),
                    "delivery_count": 0,
                    "total_yards": 0,
                    "closed": True
                })
            current += timedelta(days=1)
        return {"days": days}

    try:
        days = []
        from datetime import timedelta
        current = start_dt
        while current <= end_dt:
            date_str = current.strftime("%Y-%m-%d")
            if current.weekday() == 6:
                days.append({"date": date_str, "day": current.strftime("%A"), "delivery_count": 0, "total_yards": 0, "closed": True})
            else:
                count = await db.orders.count_documents({
                    "delivery.date": date_str,
                    "status": {"$in": ["processing", "in_delivery", "scheduled"]}
                })
                pipeline = [
                    {"$match": {"delivery.date": date_str, "status": {"$in": ["processing", "in_delivery", "scheduled"]}}},
                    {"$unwind": "$cart_items"},
                    {"$group": {"_id": None, "total": {"$sum": "$cart_items.quantity"}}}
                ]
                result = await db.orders.aggregate(pipeline).to_list(1)
                total_yards = round(result[0]["total"], 1) if result else 0
                days.append({"date": date_str, "day": current.strftime("%A"), "delivery_count": count, "total_yards": total_yards, "closed": False})
            current += timedelta(days=1)

        return {"days": days}

    except Exception as e:
        logger.error(f"Failed to fetch delivery range: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/driver/deliveries/{order_id}/status", dependencies=[Depends(verify_admin)])
async def update_delivery_status(order_id: str, update: OrderStatusUpdate):
    """
    Update delivery order status (mark as in_delivery, delivered, etc.)
    """
    try:
        if not ObjectId.is_valid(order_id):
            raise HTTPException(status_code=400, detail="Invalid order ID format")

        valid_statuses = ["processing", "in_delivery", "delivered", "cancelled"]
        if update.status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Invalid status")

        db = await get_database()
        if db is None:
            return {"success": True, "message": "Delivery status updated (demo mode)"}

        result = await db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"status": update.status, "updated_at": datetime.utcnow()}}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Order not found")

        return {"success": True, "message": "Delivery status updated"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update delivery status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Site Settings

class HeroImageUpdate(BaseModel):
    hero_image_url: str

@router.get("/settings", dependencies=[Depends(verify_admin)])
async def get_site_settings():
    """
    Get site settings
    """
    db = await get_database()
    if db is None:
        return get_demo_settings()
    
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
    Get delivery fee structure (calculated using $70 base + $5/mile formula)
    """
    return {"delivery_fees": get_demo_delivery_fees()}


# ============== POPUP SETTINGS ==============

DEFAULT_POPUP_SETTINGS = {
    "popup_active": False,
    "popup_title": "",
    "popup_message": "",
    "popup_image_url": "",
    "popup_cta_text": "",
    "popup_cta_link": "",
    "show_on_homepage": True,
    "show_on_materials": False,
    "show_on_delivery": False,
    "show_on_contact": False,
    "display_timing": "after_3_seconds",
    "start_date": "",
    "end_date": ""
}

class PopupSettingsUpdate(BaseModel):
    popup_active: bool = False
    popup_title: str = ""
    popup_message: str = ""
    popup_image_url: str = ""
    popup_cta_text: str = ""
    popup_cta_link: str = ""
    show_on_homepage: bool = True
    show_on_materials: bool = False
    show_on_delivery: bool = False
    show_on_contact: bool = False
    display_timing: str = "after_3_seconds"
    start_date: str = ""
    end_date: str = ""

def get_demo_popup_settings():
    return dict(DEFAULT_POPUP_SETTINGS)

@router.get("/popup-settings", dependencies=[Depends(verify_admin)])
async def get_popup_settings():
    """
    Get popup/seasonal settings (admin)
    """
    db = await get_database()
    if db is None:
        return get_demo_popup_settings()
    
    try:
        settings = await db.site_settings.find_one({"setting_type": "popup"})
        if not settings:
            return DEFAULT_POPUP_SETTINGS
        settings["_id"] = str(settings["_id"])
        return settings
    except Exception as e:
        logger.error(f"Failed to fetch popup settings: {str(e)} - returning defaults")
        return get_demo_popup_settings()

@router.put("/popup-settings", dependencies=[Depends(verify_admin)])
async def update_popup_settings(settings: PopupSettingsUpdate):
    """
    Update popup/seasonal settings (admin)
    """
    db = await get_database()
    if db is None:
        return {"success": True, "message": "Popup settings updated (demo mode)"}
    
    try:
        update_data = settings.model_dump()
        update_data["updated_at"] = datetime.utcnow()
        
        await db.site_settings.update_one(
            {"setting_type": "popup"},
            {"$set": update_data},
            upsert=True
        )
        
        return {"success": True, "message": "Popup settings updated successfully"}
    except Exception as e:
        logger.error(f"Failed to update popup settings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/popup-public")
async def get_popup_settings_public():
    """
    Get popup/seasonal settings (public, no auth required)
    """
    db = await get_database()
    if db is None:
        return get_demo_popup_settings()
    
    try:
        settings = await db.site_settings.find_one({"setting_type": "popup"})
        if not settings:
            return DEFAULT_POPUP_SETTINGS
        settings["_id"] = str(settings["_id"])
        return settings
    except Exception as e:
        logger.error(f"Failed to fetch popup settings: {str(e)}")
        return DEFAULT_POPUP_SETTINGS

@router.get("/config-status", dependencies=[Depends(verify_admin)])
async def get_config_status():
    """
    Return which required API keys / environment variables are configured.
    """
    required = {
        "JWT_SECRET_KEY": "JWT authentication",
        "ADMIN_PASSWORD": "Admin authentication",
        "MONGO_URL": "Mongo database",
        "RESEND_API_KEY": "Transactional email (Resend)",
        "STRIPE_API_KEY": "Stripe payments",
        "QUICKBOOKS_CLIENT_ID": "QuickBooks Online integration",
        "QUICKBOOKS_CLIENT_SECRET": "QuickBooks Online integration",
        "GOOGLE_MAPS_API_KEY": "Delivery distance lookup",
    }
    configured = {}
    missing = []
    for key, label in required.items():
        value = os.environ.get(key, "").strip()
        is_set = bool(value) and "***" not in value and "example" not in value.lower()
        configured[key] = is_set
        if not is_set:
            missing.append({"key": key, "label": label})
    return {
        "configured": configured,
        "missing": missing,
        "all_set": len(missing) == 0,
    }
