
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
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user as core_get_current_user
from app.models.user import User
from app.models.tenant import Tenant, TenantStatus
from app.models.membership import TenantUser, TenantUserRole
from app.models.billing import Subscription, SubscriptionStatus


class TenantContext:
    def __init__(self, tenant_id: int, role: TenantUserRole):
        self.tenant_id = tenant_id
        self.role = role


def _extract_tenant_id(request: Request) -> Optional[int]:
    header = request.headers.get("x-tenant-id") or request.headers.get("X-Tenant-ID")
    if not header:
        return None
    try:
        return int(header)
    except (TypeError, ValueError):
        return None


async def get_current_tenant_user(
    request: Request,
    current_user: User = Depends(core_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TenantContext:
    tenant_id = _extract_tenant_id(request)
    if tenant_id is None:
        raise HTTPException(status_code=400, detail="Missing X-Tenant-ID header")
    result = await db.execute(
        select(TenantUser).where(
            TenantUser.user_id == current_user.id,
            TenantUser.tenant_id == tenant_id,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this tenant")
    return TenantContext(tenant_id=tenant_id, role=membership.role)


def require_tenant_role(allowed_roles: list[TenantUserRole]):
    async def _check(ctx: TenantContext = Depends(get_current_tenant_user)) -> TenantContext:
        if ctx.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient tenant permissions")
        return ctx
    return _check


async def require_active_subscription(
    ctx: TenantContext = Depends(get_current_tenant_user),
    db: AsyncSession = Depends(get_db),
) -> TenantContext:
    result = await db.execute(
        select(Subscription).where(Subscription.tenant_id == ctx.tenant_id)
    )
    sub = result.scalar_one_or_none()
    if not sub or sub.status not in (
        SubscriptionStatus.TRIALING,
        SubscriptionStatus.ACTIVE,
    ):
        raise HTTPException(
            status_code=402,
            detail={
                "error": "subscription_required",
                "checkout_url": "/billing/checkout",
            },
        )
    return ctx


# alias for compatibility with existing call sites
get_current_user = core_get_current_user
