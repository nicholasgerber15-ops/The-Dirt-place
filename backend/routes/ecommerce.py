import os
import asyncio
import logging
import stripe
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
from pathlib import Path
from bson import ObjectId
from backend.data.products import PRODUCTS

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)
router = APIRouter()

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME')

TEXAS_TAX_RATE = float(os.environ.get('TEXAS_TAX_RATE', '0.0825'))
CARD_ADMIN_FEE_RATE = float(os.environ.get('CARD_ADMIN_FEE_RATE', '0.035'))
DELIVERY_FEE_BASE = float(os.environ.get('DELIVERY_FEE_BASE', '70'))
DELIVERY_FEE_PER_MILE = float(os.environ.get('DELIVERY_FEE_PER_MILE', '5'))
MIN_ORDER_YARDS = float(os.environ.get('MIN_ORDER_YARDS', '1'))
PICKUP_MIN_ORDER_YARDS = float(os.environ.get('PICKUP_MIN_ORDER_YARDS', '0.5'))
SUNDAY_DELIVERY = os.environ.get('SUNDAY_DELIVERY', 'false').lower() == 'true'
GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY', '')
DIRTPLACE_ADDRESS = os.environ.get('DIRTPLACE_ADDRESS', '240 TX-46, Boerne, TX 78006')

mongo_client = None
db = None

def get_database():
    global mongo_client, db
    if db is not None:
        return db
    if not MONGO_URL or not DB_NAME:
        return None
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        mongo_client = AsyncIOMotorClient(MONGO_URL)
        db = mongo_client[DB_NAME]
        return db
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        return None

def get_all_materials():
    return [
        {
            "material_id": p.get("material_id", ""),
            "name": p.get("name", ""),
            "price_per_unit": float(p.get("price_per_unit", 0)),
            "unit_type": p.get("unit_type", "each"),
            "category": p.get("category", ""),
            "description": p.get("description", ""),
            "image_url": p.get("image_url", ""),
            "min_order": p.get("min_order", 1),
            "stock_quantity": p.get("stock_quantity", 0),
            "product_details": p.get("product_details", ""),
        }
        for p in PRODUCTS
    ]

PALLET_ITEMS = ["Pallets", "Butter Blocks", "Bags", "Piggyback"]
PALLET_FEE = 100


def round_up_half_yard(volume):
    import math
    return math.ceil(volume * 2) / 2

DIRT_SAND_KEYWORDS = ['topsoil', 'sand', 'soil', 'dirt', 'loam', 'compost']
MULCH_KEYWORDS = ['mulch']
ROCK_KEYWORDS = ['gravel', 'rock', 'stone', 'road base', 'decorative', 'limestone', 'crushed']

SMALL_TRUCK_MAX = 5
BIG_TRUCK_DIRT_SAND_MAX = 10
BIG_TRUCK_MULCH_MAX = 12
BIG_TRUCK_ROCK_MAX = 15

def calculate_trucks_needed(cart_items: list) -> int:
    dirt_sand = 0
    mulch = 0
    rocks = 0
    for item in cart_items or []:
        name = (item.get('name', '') or '').lower()
        qty = float(item.get('quantity', 0))
        if any(k in name for k in DIRT_SAND_KEYWORDS):
            dirt_sand += qty
        elif any(k in name for k in MULCH_KEYWORDS):
            mulch += qty
        elif any(k in name for k in ROCK_KEYWORDS):
            rocks += qty
        else:
            rocks += qty

    total = dirt_sand + mulch + rocks
    if total <= SMALL_TRUCK_MAX:
        return 1

    dirt_sand_trucks = math.ceil(dirt_sand / BIG_TRUCK_DIRT_SAND_MAX) if dirt_sand > 0 else 0
    mulch_trucks = math.ceil(mulch / BIG_TRUCK_MULCH_MAX) if mulch > 0 else 0
    rocks_trucks = math.ceil(rocks / BIG_TRUCK_ROCK_MAX) if rocks > 0 else 0
    total_trucks = max(dirt_sand_trucks + mulch_trucks + rocks_trucks, 1)
    return total_trucks

async def get_distance_google_maps(delivery_address: str) -> tuple:
    """Returns (distance_miles, duration_minutes, error_message)."""
    if not GOOGLE_MAPS_API_KEY:
        return None, None, None

    import httpx

    origin = DIRTPLACE_ADDRESS
    dest = delivery_address

    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        "origins": origin,
        "destinations": dest,
        "key": GOOGLE_MAPS_API_KEY,
        "units": "imperial",
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params, timeout=10)
            data = resp.json()

        if data.get("status") != "OK":
            logger.warning(f"Google Maps API error: {data.get('status')}")
            return None, None, "Could not calculate distance. Please try a different address."

        element = data["rows"][0]["elements"][0]
        if element.get("status") != "OK":
            return None, None, "Could not calculate distance to that address."

        distance_meters = element["distance"]["value"]
        distance_miles = round(distance_meters / 1609.34, 1)
        duration_minutes = round(element["duration"]["value"] / 60)
        return distance_miles, duration_minutes, None

    except Exception as e:
        logger.error(f"Google Maps API request failed: {e}")
        return None, None, None

async def calculate_delivery_fee(delivery_address: str, date_str: str, total_yards: float, cart_items: list = None):
    distance = None
    duration = None
    distance, duration, error = await get_distance_google_maps(delivery_address)

    try:
        dt = datetime.fromisoformat(date_str)
        if dt.weekday() == 6 and not SUNDAY_DELIVERY:
            return None, "We do not deliver on Sundays. Please select another day.", distance or 0
    except:
        pass

    if distance and distance > 8 and total_yards < 2:
        return None, f"After 8 miles a minimum of 2-3 yards is required for delivery. Your total is {total_yards} yards.", distance

    if total_yards < MIN_ORDER_YARDS:
        return None, f"Minimum order is {MIN_ORDER_YARDS} yard(s) for delivery (1/2 yard for pickup).", distance or 0

    num_trucks = calculate_trucks_needed(cart_items or [])
    per_truck_fee = DELIVERY_FEE_BASE + ((distance or 0) * DELIVERY_FEE_PER_MILE)
    fee = per_truck_fee * num_trucks
    return round(fee, 2), None, distance or 0, num_trucks

class CheckoutCreateRequest(BaseModel):
    cart_items: list
    customer_name: str
    customer_email: str
    customer_phone: str
    delivery_address: str = ""
    delivery_date: str = ""
    delivery_time: str = ""
    needs_delivery: bool = True
    notes: str = ""
    origin_url: str = ""

@router.post("/create-payment-intent")
async def create_payment_intent(request: CheckoutCreateRequest):
    try:
        total_material_yards = sum(item.get('quantity', 0) for item in request.cart_items)

        delivery_fee = 0
        distance = 0
        if request.needs_delivery:
            delivery_fee, error, distance, num_trucks = await calculate_delivery_fee(
                request.delivery_address, request.delivery_date or datetime.now().isoformat(), total_material_yards, request.cart_items
            )
            if error:
                raise HTTPException(status_code=400, detail=error)

        pallet_fee = 0
        for item in request.cart_items:
            if item.get('name') in PALLET_ITEMS:
                pallet_fee += PALLET_FEE

        materials_total = 0
        for item in request.cart_items:
            price = float(item.get('price', 0))
            qty = float(item.get('quantity', 0))
            materials_total += price * qty

        subtotal = materials_total + delivery_fee + pallet_fee

        admin_fee = round(subtotal * CARD_ADMIN_FEE_RATE, 2)

        tax = round((subtotal + admin_fee) * TEXAS_TAX_RATE, 2)

        total = round(subtotal + admin_fee + tax, 2)

        total_cents = int(round(total * 100))

        order_number = f"DP-{datetime.now().strftime('%Y%m%d')}-{datetime.now().timestamp():.0f}"

        order_data = {
            "order_number": order_number,
            "customer": {
                "name": request.customer_name,
                "email": request.customer_email,
                "phone": request.customer_phone
            },
            "cart_items": request.cart_items,
            "delivery": {
                "address": request.delivery_address,
                "date": request.delivery_date,
                "time": request.delivery_time
            },
            "pricing": {
                "materials_total": round(materials_total, 2),
                "delivery_fee": delivery_fee,
                "pallet_fee": pallet_fee,
                "admin_fee": admin_fee,
                "tax": tax,
                "total": total
            },
            "notes": request.notes,
            "status": "pending_payment",
            "payment_status": "pending",
            "stripe_session_id": None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        payment_intent = stripe.PaymentIntent.create(
            amount=total_cents,
            currency="usd",
            description=f"Order {order_number} - The Dirt Place",
            metadata={
                "order_number": order_number,
            },
            receipt_email=request.customer_email,
        )

        order_data["stripe_session_id"] = payment_intent.id

        database = get_database()
        if database:
            await database.orders.insert_one(order_data)
            order_id = str(order_data["_id"])
        else:
            order_id = "demo_" + order_number

        return {
            "client_secret": payment_intent.client_secret,
            "payment_intent_id": payment_intent.id,
            "order_number": order_number,
            "order_id": order_id,
            "total": total,
            "pricing": {
                "materials_total": round(materials_total, 2),
                "delivery_fee": delivery_fee,
                "delivery_distance_miles": distance,
                "delivery_rate_per_mile": DELIVERY_FEE_PER_MILE,
                "pallet_fee": pallet_fee,
                "admin_fee": admin_fee,
                "tax": tax,
                "total": total
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment intent creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment processing failed: {str(e)}")

@router.post("/webhook")
async def stripe_webhook(request: Request):
    import json

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")

    if webhook_secret:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Stripe webhook signature verification failed: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")
    else:
        try:
            data = json.loads(payload)
            event = stripe.Event.construct_from(data, stripe.api_key)
        except Exception as e:
            logger.error(f"Failed to parse webhook payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid payload")

    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        await handle_payment_success(payment_intent)

    elif event["type"] == "payment_intent.payment_failed":
        payment_intent = event["data"]["object"]
        await handle_payment_failed(payment_intent)

    return {"status": "success"}

async def handle_payment_success(payment_intent):
    pi_id = payment_intent["id"]
    order_number = payment_intent.get("metadata", {}).get("order_number")

    database = get_database()
    if not database:
        logger.info(f"Demo mode: Payment succeeded for {pi_id}")
        return

    update_data = {
        "status": "processing",
        "payment_status": "paid",
        "updated_at": datetime.utcnow().isoformat()
    }

    if order_number:
        result = await database.orders.update_one(
            {"order_number": order_number},
            {"$set": update_data}
        )
    else:
        result = await database.orders.update_one(
            {"stripe_session_id": pi_id},
            {"$set": update_data}
        )

    if result.matched_count > 0:
        logger.info(f"Order {order_number or pi_id} marked as paid")

        order = await database.orders.find_one(
            {"order_number": order_number} if order_number else {"stripe_session_id": pi_id}
        )
        if order and order.get("customer", {}).get("email"):
            await send_order_confirmation_email(order)
    else:
        logger.warning(f"No order found for payment {pi_id}")

async def handle_payment_failed(payment_intent):
    pi_id = payment_intent["id"]
    database = get_database()
    if not database:
        return

    await database.orders.update_one(
        {"stripe_session_id": pi_id},
        {"$set": {
            "payment_status": "failed",
            "updated_at": datetime.utcnow().isoformat()
        }}
    )

async def send_order_confirmation_email(order):
    try:
        import resend

        resend.api_key = os.environ.get('RESEND_API_KEY')
        sender = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

        customer = order.get("customer", {})
        pricing = order.get("pricing", {})
        delivery = order.get("delivery", {})

        items_html = ""
        for item in order.get("cart_items", []):
            items_html += f"<tr><td style='padding:8px;border-bottom:1px solid #eee'>{item.get('name')}</td><td style='padding:8px;border-bottom:1px solid #eee'>{item.get('quantity')} cu yd</td><td style='padding:8px;border-bottom:1px solid #eee'>${float(item.get('price',0))*float(item.get('quantity',0)):.2f}</td></tr>"

        html = f"""<!DOCTYPE html>
<html><body style="font-family:Montserrat,sans-serif;color:#3B2F2F;max-width:600px;margin:0 auto;padding:20px">
<div style="background:#3B2F2F;color:#FAF9F6;padding:30px;text-align:center;border-radius:8px 8px 0 0">
<h1 style="margin:0">THE DIRT PLACE</h1>
<p style="color:#D9A441">Order Confirmation - {order.get('order_number')}</p></div>
<div style="background:#FAF9F6;padding:30px;border:2px solid #6B4F3F;border-top:none;border-radius:0 0 8px 8px">
<p>Thank you for your order, {customer.get('name')}!</p>
<table style="width:100%;border-collapse:collapse;margin:20px 0">
<tr style="background:#D9A441;color:#3B2F2F"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:left">Qty</th><th style="padding:8px;text-align:left">Amount</th></tr>
{items_html}</table>
<div style="background:white;padding:15px;border-left:3px solid #D9A441;margin:15px 0">
<p><strong>Delivery:</strong> {delivery.get('address','')} on {delivery.get('date','')} {delivery.get('time','')}</p></div>
<div style="text-align:right;margin:15px 0">
<p>Materials: ${pricing.get('materials_total',0):.2f}</p>
<p>Delivery Fee: ${pricing.get('delivery_fee',0):.2f}</p>
<p>Admin Fee: ${pricing.get('admin_fee',0):.2f}</p>
<p>Sales Tax: ${pricing.get('tax',0):.2f}</p>
<p style="font-size:24px;font-weight:bold;color:#D9A441">Total Paid: ${pricing.get('total',0):.2f}</p></div>
<p style="color:#6B4F3F">We'll contact you to confirm your delivery window. Questions? Call (830) 555-0198.</p></div>
<div style="text-align:center;padding:20px;color:#6B4F3F;font-size:12px">
<p>The Dirt Place | 240 TX-46, Boerne, TX 78006</p></div></body></html>"""

        params = {
            "from": sender,
            "to": [customer.get('email')],
            "subject": f"Order Confirmed - {order.get('order_number')} | The Dirt Place",
            "html": html
        }

        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Confirmation email sent for {order.get('order_number')}")
    except Exception as e:
        logger.error(f"Failed to send confirmation email: {e}")

@router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    database = get_database()
    if database:
        order = await database.orders.find_one({"stripe_session_id": session_id})
        if order:
            return {
                "status": order.get("status", "pending_payment"),
                "payment_status": order.get("payment_status", "pending"),
                "order_number": order.get("order_number"),
                "customer": order.get("customer", {}),
                "pricing": order.get("pricing", {}),
                "delivery": order.get("delivery", {})
            }

    try:
        payment_intent = stripe.PaymentIntent.retrieve(session_id)
        return {
            "status": "processing" if payment_intent.status == "succeeded" else "pending_payment",
            "payment_status": "paid" if payment_intent.status == "succeeded" else "pending",
            "order_number": payment_intent.metadata.get("order_number", session_id),
            "amount": payment_intent.amount / 100
        }
    except Exception as e:
        logger.error(f"Failed to retrieve payment status: {e}")
        return {
            "status": "pending_payment",
            "payment_status": "pending",
            "order_number": session_id,
            "note": "Order is being processed. Contact us at (830) 555-0198 if you have questions."
        }

@router.get("/materials")
async def get_materials():
    return {"materials": get_all_materials()}

@router.get("/delivery-fee")
async def get_delivery_fee(address: str = ""):
    if not address and not GOOGLE_MAPS_API_KEY:
        return {
            "base_fee": DELIVERY_FEE_BASE,
            "per_mile_rate": DELIVERY_FEE_PER_MILE,
            "note": "Enter a delivery address to calculate the fee."
        }

    distance, duration, error = await get_distance_google_maps(address) if address else (None, None, None)
    if error:
        raise HTTPException(status_code=400, detail=error)

    if distance is None:
        return {
            "base_fee": DELIVERY_FEE_BASE,
            "per_mile_rate": DELIVERY_FEE_PER_MILE,
            "note": "Google Maps API not configured. Enter a ZIP code for estimate."
        }

    total_fee = round(DELIVERY_FEE_BASE + (distance * DELIVERY_FEE_PER_MILE), 2)
    return {
        "address": address,
        "distance_miles": distance,
        "base_fee": DELIVERY_FEE_BASE,
        "per_mile_rate": DELIVERY_FEE_PER_MILE,
        "total_delivery_fee": total_fee
    }


