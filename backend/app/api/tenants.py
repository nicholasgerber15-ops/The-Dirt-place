
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
from app.core.database import get_db
from app.models.tenant import Tenant, TenantStatus
from app.models.membership import TenantUser, TenantUserRole
from app.models.user import User
from app.dependencies import (
    get_current_user,
    get_current_tenant_user,
    require_tenant_role,
    require_active_subscription,
)

router = APIRouter(prefix="/tenants", tags=["Tenants"])


@router.get("/me")
async def get_me(ctx: TenantContext = Depends(get_current_tenant_user)):
    return {"tenant_id": ctx.tenant_id, "role": ctx.role.value}


@router.get("/members")
async def list_members(
    ctx: TenantContext = Depends(require_tenant_role([TenantUserRole.TENANT_ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TenantUser, User)
        .join(User, TenantUser.user_id == User.id)
        .where(TenantUser.tenant_id == ctx.tenant_id)
    )
    rows = result.all()
    return [
        {
            "user_id": u.id,
            "email": u.email,
            "username": u.username,
            "role": m.role.value,
        }
        for m, u in rows
    ]


@router.post("/invite")
async def invite_member(
    email: str,
    role: str = TenantUserRole.BUSINESS.value,
    ctx: TenantContext = Depends(require_tenant_role([TenantUserRole.TENANT_ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    normalized_role = TenantUserRole(role)
    member = TenantUser(
        tenant_id=ctx.tenant_id,
        user_id=user.id,
        role=normalized_role,
    )
    db.add(member)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Membership already exists")
    return {"message": "Invited", "user_id": user.id, "role": normalized_role.value}
