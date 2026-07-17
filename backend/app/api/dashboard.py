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
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.site import Site, SiteStatus
from app.models.ticket import Ticket, TicketStatus, TicketPriority
from app.models.security import SecurityScan
from app.models.user import User
from app.services.mongodb import mongodb
from app.dependencies import require_active_subscription, get_current_tenant_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(
    ctx: TenantContext = Depends(require_active_subscription),
    db: AsyncSession = Depends(get_db),
):
    total_sites = (await db.execute(select(func.count(Site.id)).where(Site.tenant_id == ctx.tenant_id))).scalar() or 0
    online_sites = (await db.execute(select(func.count(Site.id)).where(Site.tenant_id == ctx.tenant_id, Site.status == SiteStatus.ONLINE))).scalar() or 0
    offline_sites = (await db.execute(select(func.count(Site.id)).where(Site.tenant_id == ctx.tenant_id, Site.status == SiteStatus.OFFLINE))).scalar() or 0

    open_tickets = (await db.execute(
        select(func.count(Ticket.id)).where(Ticket.tenant_id == ctx.tenant_id, Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS]))
    )).scalar() or 0
    critical_tickets = (await db.execute(
        select(func.count(Ticket.id)).where(Ticket.tenant_id == ctx.tenant_id, Ticket.priority == TicketPriority.CRITICAL, Ticket.status != TicketStatus.CLOSED)
    )).scalar() or 0

    alerts = await mongodb.get_active_alerts()
    recent_scans = (await db.execute(select(func.count(SecurityScan.id)).where(SecurityScan.tenant_id == ctx.tenant_id))).scalar() or 0

    sites = await db.execute(select(Site).where(Site.tenant_id == ctx.tenant_id, Site.last_uptime_response_ms != None))
    site_list = sites.scalars().all()
    avg_response = sum(s.last_uptime_response_ms or 0 for s in site_list) // len(site_list) if site_list else 0
    avg_uptime = round(sum(1 for s in site_list if s.status == SiteStatus.ONLINE) / len(site_list) * 100, 1) if site_list else 0

    return {
        "total_sites": total_sites,
        "online_sites": online_sites,
        "offline_sites": offline_sites,
        "open_tickets": open_tickets,
        "critical_tickets": critical_tickets,
        "active_alerts": len(alerts),
        "avg_uptime": avg_uptime,
        "avg_response_time": avg_response,
        "recent_scans": recent_scans,
    }


@router.get("/recent-activity")
async def get_recent_activity(limit: int = 20, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    from app.models.uptime import UptimeLog
    from datetime import timedelta

    logs = await db.execute(
        select(UptimeLog).order_by(UptimeLog.checked_at.desc()).limit(limit)
    )
    return [
        {
            "site_id": l.site_id,
            "status": l.status.value,
            "response_time_ms": l.response_time_ms,
            "checked_at": l.checked_at,
        }
        for l in logs.scalars().all()
    ]


@router.get("/alerts")
async def get_alerts(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await mongodb.get_active_alerts()


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    await mongodb.acknowledge_alert(alert_id)
    return {"message": "Alert acknowledged"}
