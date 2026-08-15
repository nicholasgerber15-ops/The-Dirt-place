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
import os
import re
import uuid
import logging
import asyncio
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Optional, List

import httpx
from motor.motor_asyncio import AsyncIOMotorClient

from backend.models.material import (
    Pricing,
    PriceHistoryEntry,
    QuickBooksSyncReport,
    IntegrationAuditLog,
)

logger = logging.getLogger(__name__)

QUICKBOOKS_CLIENT_ID = os.environ.get("QUICKBOOKS_CLIENT_ID")
QUICKBOOKS_CLIENT_SECRET = os.environ.get("QUICKBOOKS_CLIENT_SECRET")
QUICKBOOKS_REFRESH_TOKEN = os.environ.get("QUICKBOOKS_REFRESH_TOKEN")
QUICKBOOKS_COMPANY_ID = os.environ.get("QUICKBOOKS_COMPANY_ID")
QUICKBOOKS_ENVIRONMENT = os.environ.get("QUICKBOOKS_ENVIRONMENT", "sandbox")
QUICKBOOKS_MINOR_VERSION = os.environ.get("QUICKBOOKS_MINOR_VERSION", "75")
QUICKBOOKS_PRICE_STALE_AFTER_HOURS = int(os.environ.get("QUICKBOOKS_PRICE_STALE_AFTER_HOURS", "24"))
QUICKBOOKS_BLOCK_CHECKOUT_WHEN_STALE = os.environ.get("QUICKBOOKS_BLOCK_CHECKOUT_WHEN_STALE", "false").lower() == "true"
QUICKBOOKS_EMERGENCY_OVERRIDE_ENABLED = os.environ.get("QUICKBOOKS_EMERGENCY_OVERRIDE_ENABLED", "false").lower() == "true"
UNIT_MAPPING = {
    "cubic yard": "cubic_yard",
    "cubic yards": "cubic_yard",
    "yard": "cubic_yard",
    "yards": "cubic_yard",
    "ton": "ton",
    "tons": "ton",
    "pallet": "pallet",
    "pallets": "pallet",
    "bag": "bag",
    "bags": "bag",
    "each": "each",
    "ea": "each",
    "mile": "mile",
    "miles": "mile",
    "flat": "flat",
    "percentage": "percentage",
}


def _money(value) -> int:
    if value is None:
        return 0
    return int(Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) * 100)


def _get_base_url() -> str:
    return "https://sandbox-quickbooks.api.intuit.com" if QUICKBOOKS_ENVIRONMENT == "sandbox" else "https://quickbooks.api.intuit.com"


def _db() -> Optional[AsyncIOMotorClient]:
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        return None
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        return client[db_name]
    except Exception:
        return None


async def _refresh_access_token() -> Optional[str]:
    if not QUICKBOOKS_REFRESH_TOKEN:
        return None
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
            data={
                "grant_type": "refresh_token",
                "client_id": QUICKBOOKS_CLIENT_ID,
                "client_secret": QUICKBOOKS_CLIENT_SECRET,
                "refresh_token": QUICKBOOKS_REFRESH_TOKEN,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("access_token")


async def fetch_qbo_items(access_token: str) -> List[Dict]:
    async with httpx.AsyncClient(timeout=30) as client:
        query = (
            "SELECT Id, Name, UnitPrice, QuantityOnHand, SalesTaxCodeRef, "
            "ItemCategoryType, TrackQtyOnHand FROM Item "
            "WHERE Active = true AND Type IN ('Inventory','NonInventory','Service','OtherCharge')"
        )
        resp = await client.get(
            f"{_get_base_url()}/v3/company/{QUICKBOOKS_COMPANY_ID}/query",
            params={"query": query, "minorversion": QUICKBOOKS_MINOR_VERSION},
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        )
        resp.raise_for_status()
        return resp.json().get("QueryResponse", {}).get("Item", [])


def _normalize_unit(unit: Optional[str]) -> str:
    if not unit:
        return "each"
    key = unit.strip().lower()
    return UNIT_MAPPING.get(key, key)


def _effective_price_cents(material: Dict) -> int:
    override = material.get("pricing", {}).get("override_price_cents")
    expires_at = material.get("pricing", {}).get("override_expires_at")
    if override is not None and QUICKBOOKS_EMERGENCY_OVERRIDE_ENABLED:
        if expires_at is None or datetime.fromisoformat(expires_at) > datetime.now(timezone.utc):
            return override
    pricing = material.get("pricing", {})
    return pricing.get("retail_price_cents") or 0


async def sync_materials() -> QuickBooksSyncReport:
    sync_id = str(uuid.uuid4())
    started_at = datetime.now(timezone.utc)
    report = QuickBooksSyncReport(
        sync_id=sync_id,
        started_at=started_at,
        status="running",
    )

    db = _db()
    if db is None:
        report.status = "failed"
        report.failures.append({"error": "Database not configured"})
        report.finished_at = datetime.now(timezone.utc)
        report.summary = "Database unavailable"
        return report

    try:
        access_token = await _refresh_access_token()
        if not access_token:
            raise RuntimeError("Unable to obtain QuickBooks access token")

        qbo_items = await fetch_qbo_items(access_token)
        report.created = 0
        report.updated = 0
        report.skipped = 0

        for item in qbo_items:
            qbo_id = item.get("Id")
            name = item.get("Name", "")
            unit_price = _money(item.get("UnitPrice", 0))
            raw_unit = item.get("Unit", "each") or "each"
            mapped_unit = _normalize_unit(raw_unit)
            tax_code = item.get("SalesTaxCodeRef", {}).get("value", "")
            taxable = tax_code.lower() != "non"

            existing = await db.materials.find_one({"quickbooks_item_id": qbo_id})
            now = datetime.now(timezone.utc)

            if existing:
                previous_price = existing.get("pricing", {}).get("retail_price_cents") or 0
                if unit_price != previous_price:
                    history = PriceHistoryEntry(
                        material_id=str(existing["_id"]),
                        quickbooks_item_id=qbo_id,
                        previous_price_cents=previous_price,
                        new_price_cents=unit_price,
                        source="quickbooks_sync",
                        sync_id=sync_id,
                        changed_by="quickbooks_sync",
                        changed_at=now,
                        reason="Scheduled sync price update",
                    )
                    await db.price_history.insert_one(history.model_dump())

                update_fields = {
                    "pricing.retail_price_cents": unit_price,
                    "pricing.unit": mapped_unit,
                    "pricing.source": "quickbooks",
                    "pricing.quickbooks_synced_at": now,
                    "pricing.quickbooks_updated_at": now,
                    "pricing.sync_status": "current",
                    "pricing.quickbooks_item_id": qbo_id,
                    "taxable": taxable,
                    "accounting_status": "active",
                    "updated_at": now,
                }
                await db.materials.update_one({"_id": existing["_id"]}, {"$set": update_fields})
                report.updated += 1
            else:
                material_doc = {
                    "name": name,
                    "slug": re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or str(uuid.uuid4()),
                    "short_description": "",
                    "description": "",
                    "category": "",
                    "pricing": {
                        "retail_price_cents": unit_price,
                        "contractor_price_cents": None,
                        "unit": mapped_unit,
                        "currency": "USD",
                        "minimum_quantity": 1,
                        "source": "quickbooks",
                        "quickbooks_item_id": qbo_id,
                        "quickbooks_synced_at": now,
                        "quickbooks_updated_at": now,
                        "sync_status": "current",
                        "override_price_cents": None,
                        "override_reason": "",
                        "override_created_by": None,
                        "override_created_at": None,
                        "override_expires_at": None,
                    },
                    "images": [],
                    "specifications": {},
                    "recommended_uses": [],
                    "availability": {"in_stock": True, "quantity": None, "seasonal": False},
                    "featured": False,
                    "status": "draft",
                    "display_order": 0,
                    "product_details": "",
                    "quickbooks_item_id": qbo_id,
                    "taxable": taxable,
                    "accounting_status": "active",
                    "created_at": now,
                    "updated_at": now,
                }
                await db.materials.insert_one(material_doc)
                report.created += 1

        report.status = "success"
        report.finished_at = datetime.now(timezone.utc)
        report.summary = f"Created {report.created}, updated {report.updated}"

        await db.integration_sync_reports.insert_one(report.model_dump())
        await db.integration_connections.update_one(
            {"provider": "quickbooks"},
            {"$set": {"last_sync_at": now, "last_sync_status": "success"}},
        )
    except Exception as exc:
        logger.error("QuickBooks sync failed: %s", exc)
        report.status = "failed"
        report.failures.append({"error": str(exc)})
        report.finished_at = datetime.now(timezone.utc)
        report.summary = str(exc)
        try:
            await db.integration_sync_reports.insert_one(report.model_dump())
            await db.integration_connections.update_one(
                {"provider": "quickbooks"},
                {"$set": {"last_sync_at": datetime.now(timezone.utc), "last_sync_status": "failed", "last_error_code": "sync_exception"}},
            )
        except Exception:
            pass

    return report


async def get_connection_status() -> Dict:
    db = _db()
    if db is None:
        return {"connected": False, "reason": "database_unavailable"}

    conn = await db.integration_connections.find_one({"provider": "quickbooks"})
    if not conn:
        return {"connected": False, "reason": "not_connected"}

    mapped = await db.materials.count_documents({"quickbooks_item_id": {"$ne": None}})
    unmapped = await db.materials.count_documents({"$or": [{"quickbooks_item_id": None}, {"quickbooks_item_id": ""}]})
    stale_threshold = datetime.now(timezone.utc).timestamp() - (QUICKBOOKS_PRICE_STALE_AFTER_HOURS * 3600)
    stale = await db.materials.count_documents({
        "pricing.quickbooks_synced_at": {"$lt": datetime.fromtimestamp(stale_threshold)},
        "status": {"$in": ["published", "draft"]},
    })
    last_sync = conn.get("last_sync_at")
    last_status = conn.get("last_sync_status")
    return {
        "connected": True,
        "environment": conn.get("environment", QUICKBOOKS_ENVIRONMENT),
        "company_name": conn.get("company_name", ""),
        "last_sync_at": last_sync.isoformat() if last_sync else None,
        "last_sync_status": last_status,
        "mapped_materials": mapped,
        "unmapped_materials": unmapped,
        "stale_prices": stale,
        "reauthorization_required": conn.get("status") == "reauth_required",
    }
