from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.site import Site
from app.models.security import SecurityScan, SecurityFinding
from app.models.user import User
from app.api.schemas import ScanRequest, ScanResponse, SecurityFindingResponse
from app.services.security_scanner import security_scanner
from app.services.cloudflare import cloudflare

router = APIRouter(prefix="/security", tags=["Security"])


@router.post("/scan")
async def run_scan(data: ScanRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Site).where(Site.id == data.site_id))
    site = result.scalar_one_or_none()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    scan = await security_scanner.run_full_scan(site, db)
    return {
        "scan_id": scan.id,
        "score": scan.score,
        "summary": scan.summary,
        "findings_count": len(scan.findings),
        "status": scan.status,
    }


@router.get("/scans")
async def list_scans(site_id: int = None, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    query = select(SecurityScan).order_by(SecurityScan.created_at.desc())
    if site_id:
        query = query.where(SecurityScan.site_id == site_id)
    result = await db.execute(query.limit(50))
    return result.scalars().all()


@router.get("/scans/{scan_id}")
async def get_scan(scan_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(SecurityScan).where(SecurityScan.id == scan_id))
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    findings = await db.execute(
        select(SecurityFinding).where(SecurityFinding.scan_id == scan_id)
    )
    return {
        "scan": ScanResponse.model_validate(scan),
        "findings": [SecurityFindingResponse.model_validate(f) for f in findings.scalars().all()],
    }


@router.get("/scans/{scan_id}/findings")
async def get_scan_findings(scan_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(
        select(SecurityFinding).where(SecurityFinding.scan_id == scan_id).order_by(SecurityFinding.severity)
    )
    return result.scalars().all()


@router.get("/cloudflare/dns")
async def list_cloudflare_dns(record_type: str = "A"):
    return await cloudflare.list_dns_records(record_type)


@router.post("/cloudflare/dns")
async def create_cloudflare_dns(record_type: str, name: str, content: str, proxied: bool = True):
    return await cloudflare.create_dns_record(record_type, name, content, proxied=proxied)


@router.delete("/cloudflare/dns/{record_id}")
async def delete_cloudflare_dns(record_id: str):
    return await cloudflare.delete_dns_record(record_id)


@router.get("/cloudflare/analytics")
async def get_cloudflare_analytics(since: str = "-1440"):
    return await cloudflare.get_analytics_dashboard(since)


@router.post("/cloudflare/purge-cache")
async def purge_cloudflare_cache():
    return await cloudflare.purge_all_cache()


@router.get("/cloudflare/security-level")
async def get_cloudflare_security_level():
    return await cloudflare.get_security_level()


@router.put("/cloudflare/security-level")
async def set_cloudflare_security_level(level: str):
    return await cloudflare.set_security_level(level)
