import os
import asyncio
import logging
from datetime import datetime
from typing import Dict, Optional
from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
import resend

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# Configure
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME')
resend.api_key = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
BUSINESS_EMAIL = os.environ.get('BUSINESS_EMAIL')

# MongoDB connection
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Delivery fee structure based on ZIP codes
DELIVERY_FEES = {
    '78006': 0.00,    # Boerne - Free
    '78015': 15.00,   # Boerne area
    '78070': 20.00,   # Fair Oaks Ranch
    '78163': 25.00,   # Comfort
    '78255': 30.00,   # Leon Springs
    '78006': 0.00,    # Bergheim
}

DEFAULT_DELIVERY_FEE = 40.00  # Extended delivery areas

# Material pricing (server-side only - security)
MATERIAL_PRICES = {
    "1": {"name": "Topsoil", "price": 45.00},
    "2": {"name": "Gravel", "price": 55.00},
    "3": {"name": "Sand", "price": 40.00},
    "4": {"name": "Road Base", "price": 50.00},
    "5": {"name": "Mulch", "price": 35.00},
    "6": {"name": "Decorative Rock", "price": 75.00},
}

class CartItem(BaseModel):
    id: str
    name: str
    quantity: float
    price: float

class CheckoutRequest(BaseModel):
    cart_items: list[CartItem]
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    delivery_address: str
    delivery_zip: str
    delivery_date: str
    delivery_time: str
    notes: Optional[str] = ""
    origin_url: str

class OrderStatusUpdate(BaseModel):
    status: str

@router.post("/checkout/create-session")
async def create_checkout_session(request: CheckoutRequest):
    """
    Create Stripe checkout session for material orders
    """
    try:
        # Calculate totals (server-side for security)
        materials_total = 0.00
        validated_items = []
        
        for item in request.cart_items:
            # Validate item exists and price matches server-side pricing
            if item.id not in MATERIAL_PRICES:
                raise HTTPException(status_code=400, detail=f"Invalid material ID: {item.id}")
            
            server_price = MATERIAL_PRICES[item.id]["price"]
            materials_total += server_price * item.quantity
            
            validated_items.append({
                "id": item.id,
                "name": MATERIAL_PRICES[item.id]["name"],
                "quantity": item.quantity,
                "price": server_price
            })
        
        # Calculate delivery fee
        delivery_fee = DELIVERY_FEES.get(request.delivery_zip, DEFAULT_DELIVERY_FEE)
        
        # Total amount
        total_amount = materials_total + delivery_fee
        
        # Create order record in database BEFORE payment
        order_data = {
            "order_number": f"DP-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            "customer": {
                "name": request.customer_name,
                "email": request.customer_email,
                "phone": request.customer_phone
            },
            "delivery": {
                "address": request.delivery_address,
                "zip": request.delivery_zip,
                "date": request.delivery_date,
                "time": request.delivery_time
            },
            "items": validated_items,
            "pricing": {
                "materials_total": round(materials_total, 2),
                "delivery_fee": round(delivery_fee, 2),
                "total": round(total_amount, 2)
            },
            "notes": request.notes,
            "status": "pending_payment",
            "payment_status": "pending",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        order_result = await db.orders.insert_one(order_data)
        order_id = str(order_result.inserted_id)
        
        # Initialize Stripe checkout
        webhook_url = f"{request.origin_url}/api/ecommerce/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Create checkout session
        success_url = f"{request.origin_url}/order-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{request.origin_url}/checkout"
        
        checkout_request = CheckoutSessionRequest(
            amount=total_amount,
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "order_id": order_id,
                "order_number": order_data["order_number"],
                "customer_email": request.customer_email,
                "customer_name": request.customer_name
            }
        )
        
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        await db.payment_transactions.insert_one({
            "session_id": session.session_id,
            "order_id": order_id,
            "order_number": order_data["order_number"],
            "amount": total_amount,
            "currency": "usd",
            "payment_status": "pending",
            "customer_email": request.customer_email,
            "created_at": datetime.utcnow()
        })
        
        logger.info(f"Created checkout session for order {order_data['order_number']}")
        
        return {
            "url": session.url,
            "session_id": session.session_id,
            "order_number": order_data["order_number"]
        }
        
    except Exception as e:
        logger.error(f"Checkout session creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    """
    Get checkout session status and update order
    """
    try:
        # Get payment transaction
        transaction = await db.payment_transactions.find_one({"session_id": session_id})
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Initialize Stripe and check status
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction if status changed
        if status.payment_status != transaction.get("payment_status"):
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "payment_status": status.payment_status,
                        "stripe_status": status.status,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Update order status if paid
            if status.payment_status == "paid":
                order = await db.orders.update_one(
                    {"_id": transaction["order_id"]},
                    {
                        "$set": {
                            "payment_status": "paid",
                            "status": "processing",
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                
                # Send confirmation email
                order_data = await db.orders.find_one({"_id": transaction["order_id"]})
                if order_data:
                    await send_order_confirmation_email(order_data)
        
        return {
            "payment_status": status.payment_status,
            "order_number": transaction.get("order_number"),
            "status": status.status
        }
        
    except Exception as e:
        logger.error(f"Status check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhooks
    """
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        logger.info(f"Webhook received: {webhook_response.event_type}")
        
        if webhook_response.event_type == "checkout.session.completed":
            # Update payment transaction
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {
                    "$set": {
                        "payment_status": webhook_response.payment_status,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Update order if paid
            if webhook_response.payment_status == "paid":
                order_id = webhook_response.metadata.get("order_id")
                if order_id:
                    await db.orders.update_one(
                        {"_id": order_id},
                        {
                            "$set": {
                                "payment_status": "paid",
                                "status": "processing",
                                "updated_at": datetime.utcnow()
                            }
                        }
                    )
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhook processing failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/delivery-fee/{zip_code}")
async def get_delivery_fee(zip_code: str):
    """
    Get delivery fee for a ZIP code
    """
    fee = DELIVERY_FEES.get(zip_code, DEFAULT_DELIVERY_FEE)
    return {
        "zip_code": zip_code,
        "delivery_fee": fee,
        "in_primary_zone": zip_code in DELIVERY_FEES
    }

async def send_order_confirmation_email(order_data):
    """
    Send order confirmation email
    """
    try:
        items_html = ""
        for item in order_data["items"]:
            items_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">{item['name']}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">{item['quantity']} cu yd</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${item['price']:.2f}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${item['price'] * item['quantity']:.2f}</td>
            </tr>
            """
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; color: #3B2F2F; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #3B2F2F 0%, #6B4F3F 100%); color: #FAF9F6; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #FAF9F6; padding: 30px; border: 2px solid #6B4F3F; border-top: none; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                .total {{ background-color: #D9A441; color: #3B2F2F; font-weight: bold; padding: 15px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Order Confirmed!</h1>
                    <p>Order #{order_data['order_number']}</p>
                </div>
                <div class="content">
                    <h2>Thank you, {order_data['customer']['name']}!</h2>
                    <p>Your order has been received and is being processed.</p>
                    
                    <h3>Delivery Details</h3>
                    <p><strong>Address:</strong> {order_data['delivery']['address']}</p>
                    <p><strong>Date:</strong> {order_data['delivery']['date']}</p>
                    <p><strong>Time:</strong> {order_data['delivery']['time']}</p>
                    
                    <h3>Order Summary</h3>
                    <table>
                        <tr style="background-color: #3B2F2F; color: white;">
                            <th style="padding: 10px; text-align: left;">Material</th>
                            <th style="padding: 10px; text-align: center;">Quantity</th>
                            <th style="padding: 10px; text-align: right;">Price</th>
                            <th style="padding: 10px; text-align: right;">Subtotal</th>
                        </tr>
                        {items_html}
                        <tr>
                            <td colspan="3" style="padding: 10px; text-align: right;"><strong>Materials Total:</strong></td>
                            <td style="padding: 10px; text-align: right;">${order_data['pricing']['materials_total']:.2f}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="padding: 10px; text-align: right;"><strong>Delivery Fee:</strong></td>
                            <td style="padding: 10px; text-align: right;">${order_data['pricing']['delivery_fee']:.2f}</td>
                        </tr>
                        <tr class="total">
                            <td colspan="3" style="padding: 15px; text-align: right; font-size: 18px;">TOTAL:</td>
                            <td style="padding: 15px; text-align: right; font-size: 18px;">${order_data['pricing']['total']:.2f}</td>
                        </tr>
                    </table>
                    
                    <p>Questions? Call us at (830) 555-0198</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        params = {
            "from": SENDER_EMAIL,
            "to": [order_data['customer']['email']],
            "subject": f"Order Confirmation - {order_data['order_number']}",
            "html": html_content
        }
        
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Confirmation email sent for order {order_data['order_number']}")
        
    except Exception as e:
        logger.error(f"Failed to send confirmation email: {str(e)}")
