from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.site import Site
from app.models.user import User
from app.api.schemas import SiteCreate, SiteUpdate, SiteResponse
from app.services.monitor import monitor

router = APIRouter(prefix="/sites", tags=["Sites"])


@router.get("/", response_model=list[SiteResponse])
async def list_sites(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Site).order_by(Site.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=SiteResponse)
async def create_site(data: SiteCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    site = Site(**data.model_dump())
    db.add(site)
    await db.commit()
    await db.refresh(site)
    return site


@router.get("/{site_id}", response_model=SiteResponse)
async def get_site(site_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Site).where(Site.id == site_id))
    site = result.scalar_one_or_none()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site


@router.put("/{site_id}", response_model=SiteResponse)
async def update_site(site_id: int, data: SiteUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Site).where(Site.id == site_id))
    site = result.scalar_one_or_none()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(site, field, value)
    await db.commit()
    await db.refresh(site)
    return site


@router.delete("/{site_id}")
async def delete_site(site_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Site).where(Site.id == site_id))
    site = result.scalar_one_or_none()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    await db.delete(site)
    await db.commit()
    return {"message": "Site deleted"}


@router.post("/{site_id}/check")
async def check_site(site_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Site).where(Site.id == site_id))
    site = result.scalar_one_or_none()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    log = await monitor.check_site(site, db)
    return {
        "status": site.status.value,
        "response_time_ms": log.response_time_ms,
        "check_status": log.status.value,
    }


@router.get("/{site_id}/uptime")
async def get_uptime(site_id: int, hours: int = 24, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    stats = await monitor.get_uptime_stats(site_id, db, hours)
    return stats


@router.get("/{site_id}/uptime/history")
async def get_uptime_history(site_id: int, hours: int = 24, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    logs = await monitor.get_uptime_history(site_id, db, hours)
    return [
        {
            "status": l.status.value,
            "response_time_ms": l.response_time_ms,
            "status_code": l.status_code,
            "error_message": l.error_message,
            "checked_at": l.checked_at,
        }
        for l in logs
    ]
