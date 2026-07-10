import httpx
import time
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.site import Site, SiteStatus
from app.models.uptime import UptimeLog, UptimeStatus
from app.services.mongodb import mongodb
from app.core.config import get_settings

settings = get_settings()


class MonitorService:
    """Uptime monitoring with HTTP checks, response time tracking, and status history."""

    async def check_site(self, site: Site, db: AsyncSession) -> UptimeLog:
        """Perform a single uptime check on a site."""
        start_time = time.time()
        status = UptimeStatus.UP
        status_code = None
        response_body = None
        error_message = None
        response_ms = None

        try:
            async with httpx.AsyncClient(
                timeout=settings.heartbeat_timeout_seconds,
                follow_redirects=True,
                verify=False,
            ) as client:
                response = await client.get(site.url)
                status_code = response.status_code
                response_ms = int((time.time() - start_time) * 1000)
                response_body = response.text[:1000] if response.status_code != 200 else None

                if response.status_code >= 500:
                    status = UptimeStatus.DOWN
                elif response.status_code >= 400:
                    status = UptimeStatus.ERROR
                elif response_ms > 5000:
                    status = UptimeStatus.SLOW

        except httpx.TimeoutException:
            status = UptimeStatus.DOWN
            error_message = "Connection timed out"
            response_ms = int((time.time() - start_time) * 1000)
        except httpx.ConnectError as e:
            status = UptimeStatus.DOWN
            error_message = f"Connection failed: {str(e)}"
            response_ms = int((time.time() - start_time) * 1000)
        except Exception as e:
            status = UptimeStatus.DOWN
            error_message = str(e)
            response_ms = int((time.time() - start_time) * 1000)

        # Update site status
        site.status = SiteStatus.ONLINE if status == UptimeStatus.UP else (
            SiteStatus.DEGRADED if status == UptimeStatus.SLOW else SiteStatus.OFFLINE
        )
        site.last_checked = datetime.utcnow()
        site.last_uptime_response_ms = response_ms
        await db.commit()

        # Create log entry
        log = UptimeLog(
            site_id=site.id,
            status=status,
            response_time_ms=response_ms,
            status_code=status_code,
            response_body=response_body,
            error_message=error_message,
        )
        db.add(log)
        await db.commit()

        # Store in MongoDB for analytics
        await mongodb.save_metric(site.id, "response_time", response_ms or 0, {"status": status.value})
        await mongodb.save_metric(site.id, "uptime", 1 if status == UptimeStatus.UP else 0)

        # Create alert if down
        if status == UptimeStatus.DOWN:
            await mongodb.save_alert(site.id, "downtime", "critical", f"{site.name} is DOWN: {error_message}")

        return log

    async def check_all_sites(self, db: AsyncSession) -> list:
        """Check all enabled sites."""
        result = await db.execute(select(Site).where(Site.monitor_enabled == True))
        sites = result.scalars().all()
        logs = []
        for site in sites:
            log = await self.check_site(site, db)
            logs.append(log)
        return logs

    async def get_uptime_history(self, site_id: int, db: AsyncSession, hours: int = 24) -> list:
        """Get uptime check history for a site."""
        from datetime import timedelta
        since = datetime.utcnow() - timedelta(hours=hours)
        result = await db.execute(
            select(UptimeLog)
            .where(UptimeLog.site_id == site_id, UptimeLog.checked_at >= since)
            .order_by(UptimeLog.checked_at.desc())
        )
        return result.scalars().all()

    async def get_uptime_stats(self, site_id: int, db: AsyncSession, hours: int = 24) -> dict:
        """Calculate uptime statistics for a site."""
        logs = await self.get_uptime_history(site_id, db, hours)
        if not logs:
            return {"uptime_percent": 0, "avg_response_ms": 0, "total_checks": 0, "failed_checks": 0}

        total = len(logs)
        failed = sum(1 for l in logs if l.status != UptimeStatus.UP)
        avg_response = sum(l.response_time_ms or 0 for l in logs) / total

        return {
            "uptime_percent": round(((total - failed) / total) * 100, 2),
            "avg_response_ms": round(avg_response),
            "total_checks": total,
            "failed_checks": failed,
            "downtime_minutes": round((failed / total) * hours * 60),
        }


monitor = MonitorService()
