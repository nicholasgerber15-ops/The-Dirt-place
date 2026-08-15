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
import asyncio
import logging
import math
import stripe
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
from pathlib import Path
from bson import ObjectId
from backend.data.products import PRODUCTS
from backend.data.material_cards import MATERIAL_CARDS

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
        mongo_client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        db = mongo_client[DB_NAME]
        return db
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        return None

def get_all_materials():
    materials = [
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

    # Nfinnite material cards (placeholder pricing until QuickBooks sync)
    for card in MATERIAL_CARDS:
        materials.append({
            "material_id": card.get("material_id", ""),
            "name": card.get("product_name", ""),
            "price_per_unit": 0.0,
            "unit_type": "yard",
            "category": card.get("category", ""),
            "subcategory": card.get("subcategory", ""),
            "material_type": card.get("material_type", ""),
            "color": card.get("color", ""),
            "texture": card.get("texture", ""),
            "description": card.get("application", ""),
            "image_url": card.get("image_url", ""),
            "min_order": 1,
            "stock_quantity": 0,
            "product_details": "",
            "price_tier": card.get("price", "$$$"),
            "inventory_status": card.get("inventory_status", "Awaiting QuickBooks Sync"),
            "quickbooks_item_id": card.get("quickbooks_item_id", ""),
        })

    return materials

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
            return None, "We do not deliver on Sundays. Please select another day.", distance or 0, 0
    except:
        pass

    if distance and distance > 8 and total_yards < 2:
        return None, f"After 8 miles a minimum of 2-3 yards is required for delivery. Your total is {total_yards} yards.", distance, 0

    if total_yards < MIN_ORDER_YARDS:
        return None, f"Minimum order is {MIN_ORDER_YARDS} yard(s) for delivery (1/2 yard for pickup).", distance or 0, 0

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
        if not request.cart_items:
            raise HTTPException(status_code=400, detail="Your cart is empty")

        database = get_database()
        db_materials = {}
        unavailable = []
        if database is not None:
            for submitted_item in request.cart_items:
                material_id = str(submitted_item.get("id", ""))
                doc = None
                if ObjectId.is_valid(material_id):
                    doc = await database.materials.find_one({"_id": ObjectId(material_id)})
                if not doc:
                    doc = await database.materials.find_one({"quickbooks_item_id": material_id})
                if not doc:
                    unavailable.append(material_id)
                    continue
                db_materials[material_id] = doc
        else:
            for submitted_item in request.cart_items:
                material_id = str(submitted_item.get("id", ""))
                product = next((p for p in PRODUCTS if p.get("material_id") == material_id), None)
                if not product:
                    unavailable.append(material_id)
                    continue
                db_materials[material_id] = product

        if unavailable:
            raise HTTPException(status_code=400, detail=f"One or more cart items are no longer available: {', '.join(unavailable)}")

        normalized_items = []
        total_material_yards = 0.0
        for submitted_item in request.cart_items:
            material_id = str(submitted_item.get("id", ""))
            doc = db_materials.get(material_id)
            if not doc:
                raise HTTPException(status_code=400, detail="One or more cart items are no longer available")

            status = doc.get("status")
            if status == "archived":
                raise HTTPException(status_code=400, detail=f"{doc.get('name')} is no longer available")

            qbo_id = doc.get("quickbooks_item_id")
            if not qbo_id:
                raise HTTPException(status_code=400, detail=f"{doc.get('name')} has not been mapped to QuickBooks")

            pricing = doc.get("pricing", {})
            price_cents = pricing.get("retail_price_cents") or 0
            if price_cents <= 0:
                raise HTTPException(status_code=400, detail=f"{doc.get('name')} does not have a valid price")

            quantity = float(submitted_item.get("quantity", 0))
            if not math.isfinite(quantity) or quantity <= 0:
                raise HTTPException(status_code=400, detail=f"Invalid quantity for {doc.get('name')}")

            unit = pricing.get("unit", "each")
            if unit == "cubic_yard":
                total_material_yards += quantity
            elif unit == "ton":
                total_material_yards += quantity

            normalized_items.append({
                "id": str(doc.get("_id", doc.get("material_id"))),
                "sku": doc.get("material_id", str(doc.get("_id"))),
                "quickbooks_item_id": qbo_id,
                "name": doc.get("name"),
                "quantity": quantity,
                "unit": unit,
                "price": price_cents / 100,
                "price_snapshot_cents": price_cents,
            })

        delivery_fee = 0
        distance = 0
        if request.needs_delivery:
            delivery_fee, error, distance, num_trucks = await calculate_delivery_fee(
                request.delivery_address, request.delivery_date or datetime.now().isoformat(), total_material_yards, normalized_items
            )
            if error:
                raise HTTPException(status_code=400, detail=error)

        pallet_fee = 0
        for item in normalized_items:
            if item.get('name') in PALLET_ITEMS:
                pallet_fee += PALLET_FEE

        materials_total = 0
        for item in normalized_items:
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
            "cart_items": normalized_items,
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
                "total": total,
                "source": "server_authoritative",
                "price_snapshot_cents": {item["id"]: item["price_snapshot_cents"] for item in normalized_items},
            },
            "notes": request.notes,
            "status": "pending_payment",
            "payment_status": "pending",
            "stripe_session_id": None,
            "integrations": {
                "quickbooks": {
                    "status": "pending",
                    "entity_type": "SalesReceipt",
                    "entity_id": None,
                    "last_error": None
                }
            },
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

        db = get_database()
        if db is not None:
            await db.orders.insert_one(order_data)
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


@router.post("/create-order")
async def create_order_no_payment(request: CheckoutCreateRequest):
    """
    Create an order without requiring payment.
    Used for pickup orders or invoice-later orders.
    """
    try:
        if not request.cart_items:
            raise HTTPException(status_code=400, detail="Your cart is empty")

        database = get_database()
        db_materials = {}
        unavailable = []
        if database is not None:
            for submitted_item in request.cart_items:
                material_id = str(submitted_item.get("id", ""))
                doc = None
                if ObjectId.is_valid(material_id):
                    doc = await database.materials.find_one({"_id": ObjectId(material_id)})
                if not doc:
                    doc = await database.materials.find_one({"quickbooks_item_id": material_id})
                if not doc:
                    unavailable.append(material_id)
                    continue
                db_materials[material_id] = doc
        else:
            for submitted_item in request.cart_items:
                material_id = str(submitted_item.get("id", ""))
                product = next((p for p in PRODUCTS if p.get("material_id") == material_id), None)
                if not product:
                    unavailable.append(material_id)
                    continue
                db_materials[material_id] = product

        if unavailable:
            raise HTTPException(status_code=400, detail=f"One or more cart items are no longer available: {', '.join(unavailable)}")

        normalized_items = []
        total_material_yards = 0.0
        for submitted_item in request.cart_items:
            material_id = str(submitted_item.get("id", ""))
            doc = db_materials.get(material_id)
            if not doc:
                raise HTTPException(status_code=400, detail="One or more cart items are no longer available")

            status = doc.get("status")
            if status == "archived":
                raise HTTPException(status_code=400, detail=f"{doc.get('name')} is no longer available")

            qbo_id = doc.get("quickbooks_item_id")
            if not qbo_id:
                raise HTTPException(status_code=400, detail=f"{doc.get('name')} has not been mapped to QuickBooks")

            pricing = doc.get("pricing", {})
            price_cents = pricing.get("retail_price_cents") or 0
            if price_cents <= 0:
                raise HTTPException(status_code=400, detail=f"{doc.get('name')} does not have a valid price")

            quantity = float(submitted_item.get("quantity", 0))
            if not math.isfinite(quantity) or quantity <= 0:
                raise HTTPException(status_code=400, detail=f"Invalid quantity for {doc.get('name')}")

            unit = pricing.get("unit", "each")
            if unit == "cubic_yard":
                total_material_yards += quantity
            elif unit == "ton":
                total_material_yards += quantity

            normalized_items.append({
                "id": str(doc.get("_id", doc.get("material_id"))),
                "sku": doc.get("material_id", str(doc.get("_id"))),
                "quickbooks_item_id": qbo_id,
                "name": doc.get("name"),
                "quantity": quantity,
                "unit": unit,
                "price": price_cents / 100,
                "price_snapshot_cents": price_cents,
            })

        if not normalized_items:
            raise HTTPException(status_code=400, detail="No valid items in cart")

        delivery_fee = 0
        distance = 0
        error = None
        if request.needs_delivery and request.delivery_address:
            delivery_fee, error, distance, _ = await calculate_delivery_fee(
                request.delivery_address,
                request.delivery_date,
                total_material_yards,
                normalized_items
            )
            if error:
                raise HTTPException(status_code=400, detail=error)

        pallet_fee = 0
        for item in normalized_items:
            if item.get('name') in PALLET_ITEMS:
                pallet_fee += PALLET_FEE

        materials_total = 0
        for item in normalized_items:
            price = float(item.get('price', 0))
            qty = float(item.get('quantity', 0))
            materials_total += price * qty

        subtotal = materials_total + delivery_fee + pallet_fee
        admin_fee = round(subtotal * CARD_ADMIN_FEE_RATE, 2)
        tax = round((subtotal + admin_fee) * TEXAS_TAX_RATE, 2)
        total = round(subtotal + admin_fee + tax, 2)

        order_number = f"DP-{datetime.now().strftime('%Y%m%d')}-{datetime.now().timestamp():.0f}"

        order_data = {
            "order_number": order_number,
            "customer": {
                "name": request.customer_name,
                "email": request.customer_email,
                "phone": request.customer_phone
            },
            "cart_items": normalized_items,
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
                "total": total,
                "source": "server_authoritative",
                "price_snapshot_cents": {item["id"]: item["price_snapshot_cents"] for item in normalized_items},
            },
            "notes": request.notes,
            "status": "pending_pickup",
            "payment_status": "pending_pickup",
            "stripe_session_id": None,
            "integrations": {
                "quickbooks": {
                    "status": "pending",
                    "entity_type": "SalesReceipt",
                    "entity_id": None,
                    "last_error": None
                }
            },
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        db = get_database()
        order_id = None
        if db is not None:
            result = await db.orders.insert_one(order_data)
            order_id = str(result.inserted_id)
        else:
            order_id = "demo_" + order_number

        order_data["_id"] = order_id

        if request.needs_delivery and request.delivery_date and request.delivery_time:
            try:
                from backend.routes.scheduling import book_slot_for_order
                await book_slot_for_order(
                    date=request.delivery_date,
                    time=request.delivery_time,
                    order_id=order_id,
                    address=request.delivery_address,
                    customer_name=request.customer_name
                )
            except Exception as slot_error:
                logger.warning(f"Delivery slot booking failed for order {order_number}: {slot_error}")

        return {
            "success": True,
            "order_number": order_number,
            "order_id": order_id,
            "status": "pending_pickup",
            "payment_status": "pending_pickup",
            "total": total,
            "pricing": order_data["pricing"],
            "message": "Order placed successfully! Please pay at pickup."
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Order creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")

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
    elif os.environ.get("DEV_MODE"):
        try:
            data = json.loads(payload)
            event = stripe.Event.construct_from(data, stripe.api_key)
        except Exception as e:
            logger.error(f"Failed to parse webhook payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid payload")
    else:
        raise HTTPException(status_code=503, detail="Stripe webhook verification is not configured")

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
    if database is None:
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
    if database is None:
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
<p style="color:#6B4F3F">We'll contact you to confirm your delivery window. Questions? Call (830) 336-3713.</p></div>
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
    if database is not None:
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
            "note": "Order is being processed. Contact us at (830) 336-3713 if you have questions."
        }

QUICKBOOKS_CLIENT_ID = os.environ.get('QUICKBOOKS_CLIENT_ID')
QUICKBOOKS_CLIENT_SECRET = os.environ.get('QUICKBOOKS_CLIENT_SECRET')
QUICKBOOKS_ACCESS_TOKEN = os.environ.get('QUICKBOOKS_ACCESS_TOKEN')
QUICKBOOKS_REFRESH_TOKEN = os.environ.get('QUICKBOOKS_REFRESH_TOKEN')
QUICKBOOKS_COMPANY_ID = os.environ.get('QUICKBOOKS_COMPANY_ID')
QUICKBOOKS_ENVIRONMENT = os.environ.get('QUICKBOOKS_ENVIRONMENT', 'sandbox')
QUICKBOOKS_MINOR_VERSION = os.environ.get('QUICKBOOKS_MINOR_VERSION', '75')

@router.get("/materials")
async def get_materials():
    database = get_database()
    if database is not None:
        published = []
        async for m in database.materials.find({"status": "published"}):
            m["_id"] = str(m["_id"])
            pricing = m.get("pricing", {})
            unit = pricing.get("unit", "each")
            retail_cents = pricing.get("retail_price_cents", 0) or 0
            contractor_cents = pricing.get("contractor_price_cents")
            m["price"] = retail_cents / 100
            m["price_per_unit"] = retail_cents / 100
            m["contractor_price"] = (contractor_cents / 100) if contractor_cents is not None else None
            m["unit_type"] = unit
            published.append(m)

        admin_materials = []
        async for m in database.material_pricing.find({}):
            admin_materials.append({
                "material_id": m.get("material_id", ""),
                "name": m.get("name", ""),
                "price_per_unit": float(m.get("price_per_unit", 0) or 0),
                "unit_type": m.get("unit_type", "each"),
                "category": m.get("category", ""),
                "description": m.get("description", ""),
                "image_url": m.get("image_url", ""),
                "min_order": m.get("min_order", 1),
                "stock_quantity": m.get("stock_quantity", 0),
                "product_details": m.get("product_details", ""),
            })

        static = get_all_materials()

        seen = set()
        combined = []
        for m in published + admin_materials:
            mid = m.get("material_id") or m.get("_id")
            if mid and mid not in seen:
                seen.add(mid)
                combined.append(m)

        for m in static:
            mid = m.get("material_id") or m.get("_id")
            if mid and mid not in seen:
                seen.add(mid)
                combined.append(m)
        return {"materials": combined}

    return {"materials": get_all_materials()}

@router.post("/ecommerce/quickbooks/sync")
async def sync_quickbooks(request: Request):
    """
    Sync materials from QuickBooks Online inventory.
    """
    if not all([QUICKBOOKS_CLIENT_ID, QUICKBOOKS_CLIENT_SECRET, QUICKBOOKS_ACCESS_TOKEN, QUICKBOOKS_COMPANY_ID]):
        raise HTTPException(status_code=503, detail="QuickBooks not configured")

    try:
        import httpx
        base_url = "https://sandbox-quickbooks.api.intuit.com" if QUICKBOOKS_ENVIRONMENT == "sandbox" else "https://quickbooks.api.intuit.com"

        async with httpx.AsyncClient(timeout=30) as client:
            if QUICKBOOKS_REFRESH_TOKEN:
                refresh_headers = {"Content-Type": "application/x-www-form-urlencoded"}
                refresh_data = {
                    "grant_type": "refresh_token",
                    "client_id": QUICKBOOKS_CLIENT_ID,
                    "client_secret": QUICKBOOKS_CLIENT_SECRET,
                    "refresh_token": QUICKBOOKS_REFRESH_TOKEN,
                }
                token_resp = await client.post(
                    "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
                    data=refresh_data,
                    headers=refresh_headers,
                )
                token_resp.raise_for_status()
                tokens = token_resp.json()
                access_token = tokens.get("access_token", QUICKBOOKS_ACCESS_TOKEN)
            else:
                access_token = QUICKBOOKS_ACCESS_TOKEN

            query = "SELECT Id, Name, UnitPrice, QuantityOnHand, SalesTaxCodeRef, ItemCategoryType, TrackQtyOnHand FROM Item WHERE Active = true AND Type IN ('Inventory', 'NonInventory', 'Service', 'OtherCharge')"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
                "Content-Type": "application/json",
            }
            qbo_resp = await client.get(
                f"{base_url}/v3/company/{QUICKBOOKS_COMPANY_ID}/query",
                params={"query": query, "minorversion": QUICKBOOKS_MINOR_VERSION},
                headers=headers,
            )
            qbo_resp.raise_for_status()
            qbo_data = qbo_resp.json()
            qbo_items = qbo_data.get("QueryResponse", {}).get("Item", [])

            synced = []
            for item in qbo_items:
                material = {
                    "material_id": item.get("Id", ""),
                    "name": item.get("Name", ""),
                    "price_per_unit": float(item.get("UnitPrice", 0)),
                    "unit_type": "each",
                    "category": item.get("ItemCategoryType", "QuickBooks"),
                    "description": item.get("Name", ""),
                    "stock_quantity": int(item.get("QuantityOnHand", 0)) if item.get("TrackQtyOnHand") else 0,
                    "quickbooks_id": item.get("Id"),
                    "synced_from": "quickbooks",
                }
                synced.append(material)

            return {"materials": synced, "synced_count": len(synced), "source": "quickbooks"}

    except httpx.HTTPStatusError as e:
        logger.error(f"QuickBooks sync HTTP error: {e.response.status_code} {e.response.text}")
        raise HTTPException(status_code=502, detail=f"QuickBooks API error: {e.response.status_code}")
    except Exception as e:
        logger.error(f"QuickBooks sync failed: {e}")
        raise HTTPException(status_code=500, detail=f"QuickBooks sync failed: {str(e)}")

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


