
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
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import os
from app.core.database import get_db
from app.models.tenant import Tenant
from app.models.billing import Subscription, SubscriptionStatus, Invoice
from app.dependencies import require_active_subscription, get_current_tenant_user, TenantContext
from app.api.schemas import StripeConnectRequest, StripeConnectStatusResponse

router = APIRouter(prefix="/billing", tags=["Billing"])


@router.get("/subscription")
async def get_subscription(
    ctx: TenantContext = Depends(require_active_subscription),
    db: AsyncSession = Depends(get_db),
):
    sub = (await db.execute(select(Subscription).where(Subscription.tenant_id == ctx.tenant_id))).scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="No subscription")
    return {
        "status": sub.status.value,
        "plan": sub.plan,
        "price_cents": sub.price_cents,
        "interval": sub.interval,
        "current_period_end": sub.current_period_end,
    }


@router.post("/checkout")
async def create_checkout(
    ctx: TenantContext = Depends(require_active_subscription),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tenant).where(Tenant.id == ctx.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant or not tenant.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No Stripe customer on tenant")
    # In production: create real Stripe checkout session via server-side call or proxy
    return {
        "checkout_url": "https://checkout.stripe.com/pay/placeholder",
        "session_id": "cs_" + datetime.utcnow().strftime("%Y%m%d%H%M%S"),
    }


@router.get("/invoices")
async def list_invoices(
    ctx: TenantContext = Depends(require_active_subscription),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invoice).where(Invoice.tenant_id == ctx.tenant_id).order_by(Invoice.created_at.desc()).limit(100)
    )
    invoices = result.scalars().all()
    return [
        {
            "id": i.id,
            "amount_cents": i.amount_cents,
            "status": i.status,
            "paid_at": i.paid_at,
            "created_at": i.created_at,
        }
        for i in invoices
    ]


@router.post("/webhooks/stripe")
async def stripe_webhook(db: AsyncSession = Depends(get_db)):
    # Placeholder: validate signature, update Subscription/Invoice by customer/subscription id
    return {"received": True}


@router.post("/stripe/connect", response_model=StripeConnectStatusResponse)
async def connect_stripe_api_key(
    payload: StripeConnectRequest,
    ctx: TenantContext = Depends(get_current_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    tenant = (await db.execute(select(Tenant).where(Tenant.id == ctx.tenant_id))).scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    api_key = payload.api_key.strip()
    if not api_key.startswith(("sk_test_", "sk_live_")) or len(api_key) < 20:
        raise HTTPException(status_code=400, detail="Invalid Stripe API key format")

    last_four = api_key[-4:]
    allow_plaintext = os.getenv("ALLOW_PLAINTEXT_STRIPE_KEY", "false").lower() == "true"
    stored = api_key if allow_plaintext else f"{api_key[:8]}...{last_four}"

    tenant.stripe_api_key_encrypted = stored
    await db.commit()
    return StripeConnectStatusResponse(connected=True, last_four=last_four)


@router.get("/stripe/connect-status", response_model=StripeConnectStatusResponse)
async def get_stripe_connect_status(
    ctx: TenantContext = Depends(get_current_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    tenant = (await db.execute(select(Tenant).where(Tenant.id == ctx.tenant_id))).scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return StripeConnectStatusResponse(
        connected=bool(tenant.stripe_api_key_encrypted),
        stripe_connect_account_id=tenant.stripe_connect_account_id,
        last_four=tenant.stripe_api_key_encrypted[-4:] if tenant.stripe_api_key_encrypted else None,
    )
