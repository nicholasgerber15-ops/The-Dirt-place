
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
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user, hash_password, create_access_token
from app.models.user import User
from app.models.tenant import Tenant, TenantStatus
from app.models.membership import TenantUser, TenantUserRole
from app.models.billing import Subscription, SubscriptionStatus
from app.models.site import Site
from app.api.schemas import (
    UserCreate,
    TokenResponse,
    SiteCreate,
    SiteResponse,
)
from datetime import datetime, date
from app.dependencies import TenantContext, require_tenant_role
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(User).where((User.email == data.email) | (User.username == data.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email or username already exists")

    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user_id=user.id, role=user.role.value)


@router.post("/register-tenant", response_model=TokenResponse)
async def register_tenant(
    name: str = Query(...),
    slug: str = Query(...),
    email: str = Query(...),
    username: str = Query(...),
    password: str = Query(...),
    site_name: str = Query("Default Site"),
    site_url: str = Query(...),
    trial_days: int = Query(14),
    requires_trial: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    tenant = Tenant(name=name, slug=slug, status=TenantStatus.ACTIVE)
    db.add(tenant)
    await db.flush()

    trial_status = SubscriptionStatus.TRIALING if requires_trial else SubscriptionStatus.ACTIVE
    now = datetime.utcnow()
    sub = Subscription(
        tenant_id=tenant.id,
        status=trial_status,
        plan="basic",
        stripe_customer_id=None,
        stripe_subscription_id=None,
        current_period_end=now,
    )
    db.add(sub)
    await db.flush()

    user = User(
        email=email,
        username=username,
        hashed_password=hash_password(password),
        full_name=username,
        role="tenant_admin",
    )
    db.add(user)
    await db.flush()

    member = TenantUser(
        tenant_id=tenant.id,
        user_id=user.id,
        role=TenantUserRole.TENANT_ADMIN,
    )
    db.add(member)

    site = Site(
        name=site_name,
        url=site_url,
        tenant_id=tenant.id,
        monitor_enabled=True,
        check_interval_seconds=60,
        config={},
    )
    db.add(site)

    await db.commit()

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user_id=user.id, role="tenant_admin")


@router.post("/join-tenant", response_model=TokenResponse)
async def join_tenant(
    email: str = Query(...),
    password: str = Query(...),
    tenant_slug: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    result = await db.execute(select(Tenant).where(Tenant.slug == tenant_slug))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    existing = await db.execute(
        select(TenantUser).where(
            TenantUser.user_id == user.id,
            TenantUser.tenant_id == tenant.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already a member of this tenant")

    member = TenantUser(
        tenant_id=tenant.id,
        user_id=user.id,
        role=TenantUserRole.BUSINESS,
    )
    db.add(member)
    await db.commit()

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token, user_id=user.id, role=user.role.value, tenant_id=tenant.id
    )


@router.get("/me")
async def get_me(
    current_user: User = Depends(get_current_user),
    ctx: TenantContext = Depends(get_current_tenant_user),
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "tenant_id": ctx.tenant_id,
        "tenant_role": ctx.role.value,
    }


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user_id=user.id, role=user.role.value)
