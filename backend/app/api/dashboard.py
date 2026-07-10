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

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    # Site stats
    total_sites = (await db.execute(select(func.count(Site.id)))).scalar() or 0
    online_sites = (await db.execute(select(func.count(Site.id)).where(Site.status == SiteStatus.ONLINE))).scalar() or 0
    offline_sites = (await db.execute(select(func.count(Site.id)).where(Site.status == SiteStatus.OFFLINE))).scalar() or 0

    # Ticket stats
    open_tickets = (await db.execute(
        select(func.count(Ticket.id)).where(Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS]))
    )).scalar() or 0
    critical_tickets = (await db.execute(
        select(func.count(Ticket.id)).where(Ticket.priority == TicketPriority.CRITICAL, Ticket.status != TicketStatus.CLOSED)
    )).scalar() or 0

    # Alerts
    alerts = await mongodb.get_active_alerts()

    # Recent scans
    recent_scans = (await db.execute(select(func.count(SecurityScan.id)))).scalar() or 0

    # Average response time from recent sites
    avg_response = 0
    sites = await db.execute(select(Site).where(Site.last_uptime_response_ms != None))
    site_list = sites.scalars().all()
    if site_list:
        avg_response = sum(s.last_uptime_response_ms or 0 for s in site_list) // len(site_list)

    # Average uptime
    avg_uptime = 0
    online_count = sum(1 for s in site_list if s.status == SiteStatus.ONLINE)
    if site_list:
        avg_uptime = round((online_count / len(site_list)) * 100, 1)

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
