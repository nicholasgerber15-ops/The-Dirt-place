import os
import asyncio
import logging
from datetime import datetime
from typing import Dict, Optional
from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
from pathlib import Path
import resend

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)
router = APIRouter()

resend.api_key = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
BUSINESS_EMAIL = os.environ.get('BUSINESS_EMAIL')

# Demo materials data
DEMO_MATERIALS = [
    {"id": "1", "name": "Topsoil", "price": 45, "description": "Premium garden topsoil", "unit": "cubic yard"},
    {"id": "2", "name": "Gravel", "price": 55, "description": "Driveway gravel", "unit": "cubic yard"},
    {"id": "3", "name": "Sand", "price": 40, "description": "Construction sand", "unit": "cubic yard"},
    {"id": "4", "name": "Road Base", "price": 50, "description": "Crushed limestone", "unit": "cubic yard"},
    {"id": "5", "name": "Mulch", "price": 35, "description": "Natural wood chips", "unit": "cubic yard"},
    {"id": "6", "name": "Decorative Rock", "price": 75, "description": "Landscape stones", "unit": "cubic yard"},
]

@router.get("/materials")
async def get_materials():
    return {"materials": DEMO_MATERIALS}

@router.get("/delivery-fee/{zip_code}")
async def get_delivery_fee(zip_code: str):
    fees = {
        "78006": {"fee": 0, "area": "Boerne"},
        "78015": {"fee": 15, "area": "Boerne Area"},
        "78070": {"fee": 20, "area": "Fair Oaks Ranch"},
        "78163": {"fee": 25, "area": "Comfort"},
        "78255": {"fee": 30, "area": "Leon Springs"},
    }
    return {"zip_code": zip_code, **fees.get(zip_code, {"fee": 40, "area": "Extended Area"})}

class CheckoutRequest(BaseModel):
    material: str
    quantity: int
    name: str
    email: EmailStr
    phone: str
    delivery_address: str
    zip_code: str
    project_type: str = "residential"

@router.post("/checkout")
async def create_checkout(request: CheckoutRequest):
    material = next((m for m in DEMO_MATERIALS if m["name"] == request.material), None)
    if not material:
        raise HTTPException(status_code=400, detail="Material not found")
    
    delivery_fee = 25 if request.zip_code != "78006" else 0
    total = material["price"] * request.quantity + delivery_fee
    
    order = {
        "order_number": f"ORD-{datetime.now().strftime('%Y%m%d')}-{datetime.now().timestamp():.0f}",
        "customer": {
            "name": request.name,
            "email": request.email,
            "phone": request.phone
        },
        "material": request.material,
        "quantity": request.quantity,
        "delivery_address": request.delivery_address,
        "zip_code": request.zip_code,
        "pricing": {
            "material": material["price"] * request.quantity,
            "delivery": delivery_fee,
            "total": total
        },
        "status": "pending_payment",
        "created_at": datetime.now().isoformat()
    }
    
    return {
        "status": "success",
        "order": order,
        "checkout_url": f"/order-success?order={order['order_number']}"
    }

@router.get("/checkout/{order_id}")
async def get_checkout_status(order_id: str):
    return {
        "order_id": order_id,
        "status": "pending_payment",
        "message": "Payment pending - contact us to complete order"
    }