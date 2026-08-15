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
import json
import uuid
import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any

import httpx
from fastapi import APIRouter, HTTPException, Depends, Header, Request
from pydantic import BaseModel, Field
from jose import jwt
from jose import exceptions as jwt_exceptions
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

from backend.models.material import (
    QuickBooksConnection,
    QuickBooksSyncReport,
    IntegrationAuditLog,
    MaterialUpdate,
    MaterialResponse,
    PriceHistoryEntry,
)

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
logger = logging.getLogger(__name__)

router = APIRouter()

QUICKBOOKS_CLIENT_ID = os.environ.get("QUICKBOOKS_CLIENT_ID")
QUICKBOOKS_CLIENT_SECRET = os.environ.get("QUICKBOOKS_CLIENT_SECRET")
QUICKBOOKS_REDIRECT_URI = os.environ.get("QUICKBOOKS_REDIRECT_URI")
QUICKBOOKS_COMPANY_ID = os.environ.get("QUICKBOOKS_COMPANY_ID")
ADMIN_JWT_SECRET = os.environ.get("ADMIN_JWT_SECRET_KEY")
ADMIN_JWT_ALGORITHM = "HS256"


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


def verify_admin(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    if not ADMIN_JWT_SECRET:
        raise HTTPException(status_code=503, detail="Admin authentication is not configured")
    try:
        payload = jwt.decode(token, ADMIN_JWT_SECRET, algorithms=[ADMIN_JWT_ALGORITHM], audience="admin-panel")
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Forbidden")
        return True
    except jwt_exceptions.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt_exceptions.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


class QuickBooksConnectRequest(BaseModel):
    code: str
    realm_id: str
    company_name: str = ""


class QuickBooksItemMapping(BaseModel):
    material_id: str
    quickbooks_item_id: str
    unit: str = "each"


class EmergencyOverrideRequest(BaseModel):
    material_id: str
    override_price_cents: int = Field(ge=0)
    override_reason: str = Field(max_length=500)
    override_expires_at: Optional[str] = None


class ItemMappingResponse(BaseModel):
    material_id: str
    material_name: str
    quickbooks_item_id: Optional[str] = None
    qbo_name: Optional[str] = None
    unit: Optional[str] = None
    retail_price_cents: Optional[int] = None
    mapped_at: Optional[str] = None


@router.get("/status")
async def get_quickbooks_status():
    from backend.services.quickbooks_sync import get_connection_status
    return await get_connection_status()


@router.get("/mappings")
async def get_quickbooks_mappings():
    db = _db()
    if db is None:
        return {"mappings": [], "unmapped": [], "duplicates": []}

    materials = await db.materials.find({}).to_list(1000)
    qbo_ids_seen = {}
    mappings = []
    unmapped = []
    duplicates = []

    for m in materials:
        qbo_id = m.get("quickbooks_item_id")
        material_id = str(m["_id"])
        name = m.get("name", "")
        pricing = m.get("pricing", {})
        entry = ItemMappingResponse(
            material_id=material_id,
            material_name=name,
            quickbooks_item_id=qbo_id,
            unit=pricing.get("unit"),
            retail_price_cents=pricing.get("retail_price_cents"),
            mapped_at=pricing.get("quickbooks_synced_at").isoformat() if pricing.get("quickbooks_synced_at") else None,
        )
        if qbo_id:
            mappings.append(entry.model_dump())
            if qbo_id in qbo_ids_seen:
                existing = qbo_ids_seen[qbo_id]
                duplicates.append({
                    "quickbooks_item_id": qbo_id,
                    "materials": [existing["material_id"], material_id],
                    "names": [existing["material_name"], name],
                })
            else:
                qbo_ids_seen[qbo_id] = {"material_id": material_id, "material_name": name}
        else:
            unmapped.append(entry.model_dump())

    return {"mappings": mappings, "unmapped": unmapped, "duplicates": duplicates}


@router.post("/mappings")
async def save_quickbooks_mapping(mapping: QuickBooksItemMapping):
    db = _db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")

    if not ObjectId.is_valid(mapping.material_id):
        raise HTTPException(status_code=400, detail="Invalid material_id")

    existing = await db.materials.find_one({"_id": ObjectId(mapping.material_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Material not found")

    duplicate = await db.materials.find_one({
        "_id": {"$ne": ObjectId(mapping.material_id)},
        "quickbooks_item_id": mapping.quickbooks_item_id,
    })
    if duplicate:
        raise HTTPException(status_code=409, detail="This QuickBooks item is already mapped to another material")

    await db.materials.update_one(
        {"_id": ObjectId(mapping.material_id)},
        {"$set": {"quickbooks_item_id": mapping.quickbooks_item_id, "pricing.unit": mapping.unit, "updated_at": datetime.now(timezone.utc)}},
    )
    return {"success": True}


@router.delete("/mappings/{material_id}")
async def delete_quickbooks_mapping(material_id: str):
    db = _db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")

    if not ObjectId.is_valid(material_id):
        raise HTTPException(status_code=400, detail="Invalid material_id")

    await db.materials.update_one(
        {"_id": ObjectId(material_id)},
        {"$set": {"quickbooks_item_id": None, "updated_at": datetime.now(timezone.utc)}},
    )
    return {"success": True}


@router.post("/connect")
async def connect_quickbooks(request: QuickBooksConnectRequest, authorization: Optional[str] = Header(None)):
    verify_admin(authorization)
    db = _db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")

    if not QUICKBOOKS_CLIENT_ID or not QUICKBOOKS_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="QuickBooks OAuth credentials are not configured")

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
            data={
                "grant_type": "authorization_code",
                "client_id": QUICKBOOKS_CLIENT_ID,
                "client_secret": QUICKBOOKS_CLIENT_SECRET,
                "code": request.code,
                "redirect_uri": QUICKBOOKS_REDIRECT_URI,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"QuickBooks token exchange failed: {resp.text}")
        tokens = resp.json()

    access_token = tokens.get("access_token", "")
    refresh_token = tokens.get("refresh_token", "")
    expires_in = int(tokens.get("expires_in", 3600))
    refresh_expires_in = int(tokens.get("x_refresh_token_expires_in", 7776000))

    connection = QuickBooksConnection(
        realm_id=request.realm_id,
        company_name=request.company_name,
        access_token_ciphertext=access_token,
        refresh_token_ciphertext=refresh_token,
        access_token_expires_at=datetime.now(timezone.utc) + timedelta(seconds=expires_in),
        refresh_token_expires_at=datetime.now(timezone.utc) + timedelta(seconds=refresh_expires_in),
        scopes=tokens.get("scope", "").split(" ") if tokens.get("scope") else [],
        status="connected",
        connected_by="admin",
        connected_at=datetime.now(timezone.utc),
    )
    await db.integration_connections.replace_one({"provider": "quickbooks"}, connection.model_dump(), upsert=True)

    await db.integration_audit_log.insert_one(IntegrationAuditLog(
        provider="quickbooks",
        event="connect",
        actor="admin",
        timestamp=datetime.now(timezone.utc),
        outcome="success",
        details={"realm_id": request.realm_id},
    ).model_dump())

    from backend.services.quickbooks_sync import sync_materials
    report = await sync_materials()

    return {"success": True, "connection": connection.model_dump(), "sync_report": report.model_dump()}


@router.post("/disconnect")
async def disconnect_quickbooks(authorization: Optional[str] = Header(None)):
    verify_admin(authorization)
    db = _db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")

    await db.integration_connections.delete_many({"provider": "quickbooks"})
    await db.integration_audit_log.insert_one(IntegrationAuditLog(
        provider="quickbooks",
        event="disconnect",
        actor="admin",
        timestamp=datetime.now(timezone.utc),
        outcome="success",
    ).model_dump())
    return {"success": True}


@router.post("/sync")
async def trigger_sync(authorization: Optional[str] = Header(None)):
    verify_admin(authorization)
    from backend.services.quickbooks_sync import sync_materials
    report = await sync_materials()
    return report.model_dump()


@router.get("/items")
async def list_qbo_items():
    db = _db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")

    conn = await db.integration_connections.find_one({"provider": "quickbooks"})
    if not conn:
        raise HTTPException(status_code=400, detail="QuickBooks is not connected")

    from backend.services.quickbooks_sync import _refresh_access_token, fetch_qbo_items
    token = await _refresh_access_token()
    if not token:
        raise HTTPException(status_code=502, detail="Unable to refresh QuickBooks access token")

    items = await fetch_qbo_items(token)
    return {
        "items": [
            {
                "id": i.get("Id"),
                "name": i.get("Name"),
                "unit_price": i.get("UnitPrice"),
                "unit": i.get("Unit"),
                "quantity_on_hand": i.get("QuantityOnHand"),
                "category": i.get("ItemCategoryType"),
            }
            for i in items
        ]
    }


@router.post("/emergency-override")
async def set_emergency_override(override: EmergencyOverrideRequest, authorization: Optional[str] = Header(None)):
    if not os.environ.get("QUICKBOOKS_EMERGENCY_OVERRIDE_ENABLED", "false").lower() == "true":
        raise HTTPException(status_code=403, detail="Emergency override is disabled")

    verify_admin(authorization)
    db = _db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")

    if not ObjectId.is_valid(override.material_id):
        raise HTTPException(status_code=400, detail="Invalid material_id")

    material = await db.materials.find_one({"_id": ObjectId(override.material_id)})
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    pricing = material.get("pricing", {})
    previous_price = pricing.get("retail_price_cents", 0)

    update = {
        "pricing.override_price_cents": override.override_price_cents,
        "pricing.override_reason": override.override_reason,
        "pricing.override_created_by": "admin",
        "pricing.override_created_at": datetime.now(timezone.utc),
        "pricing.override_expires_at": datetime.fromisoformat(override.override_expires_at) if override.override_expires_at else None,
        "updated_at": datetime.now(timezone.utc),
    }
    await db.materials.update_one({"_id": ObjectId(override.material_id)}, {"$set": update})

    await db.price_history.insert_one(PriceHistoryEntry(
        material_id=override.material_id,
        quickbooks_item_id=pricing.get("quickbooks_item_id"),
        previous_price_cents=previous_price,
        new_price_cents=override.override_price_cents,
        source="emergency_override",
        sync_id=str(uuid.uuid4()),
        changed_by="admin",
        changed_at=datetime.now(timezone.utc),
        reason=override.override_reason,
    ).model_dump())

    return {"success": True}


@router.delete("/emergency-override/{material_id}")
async def clear_emergency_override(material_id: str, authorization: Optional[str] = Header(None)):
    if not os.environ.get("QUICKBOOKS_EMERGENCY_OVERRIDE_ENABLED", "false").lower() == "true":
        raise HTTPException(status_code=403, detail="Emergency override is disabled")

    verify_admin(authorization)
    db = _db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")

    if not ObjectId.is_valid(material_id):
        raise HTTPException(status_code=400, detail="Invalid material_id")

    await db.materials.update_one(
        {"_id": ObjectId(material_id)},
        {"$set": {
            "pricing.override_price_cents": None,
            "pricing.override_reason": "",
            "pricing.override_created_by": None,
            "pricing.override_created_at": None,
            "pricing.override_expires_at": None,
            "updated_at": datetime.now(timezone.utc),
        }},
    )
    return {"success": True}
