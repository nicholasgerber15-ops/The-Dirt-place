from __future__ import annotations

import os
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

from backend.routes.admin import verify_admin

logger = __name__  # will be replaced by logging.getLogger(__name__) if needed
router = APIRouter(prefix="/admin/delivery-zones", tags=["admin-delivery-zones"])


class DeliveryZoneCreate(BaseModel):
    name: str
    zip_codes: list[str]
    fee_base: float
    fee_per_mile: float
    min_order_yards: float
    sunday_delivery: bool = False
    active: bool = True


class DeliveryZoneUpdate(BaseModel):
    name: Optional[str] = None
    zip_codes: Optional[list[str]] = None
    fee_base: Optional[float] = None
    fee_per_mile: Optional[float] = None
    min_order_yards: Optional[float] = None
    sunday_delivery: Optional[bool] = None
    active: Optional[bool] = None


def get_database():
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        return None
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        return client[db_name]
    except Exception:
        return None


@router.get("", dependencies=[Depends(verify_admin)])
async def list_delivery_zones():
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        zones = await db.delivery_zones.find().sort("name", 1).to_list(100)
        for zone in zones:
            zone["id"] = str(zone.pop("_id"))
        return {"zones": zones}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", dependencies=[Depends(verify_admin)])
async def create_delivery_zone(zone: DeliveryZoneCreate):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        doc = zone.model_dump()
        result = await db.delivery_zones.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        return {"zone": doc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{zone_id}", dependencies=[Depends(verify_admin)])
async def update_delivery_zone(zone_id: str, update: DeliveryZoneUpdate):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        update_data = {k: v for k, v in update.model_dump().items() if v is not None}
        if not update_data:
            return {"success": True, "message": "No changes provided"}
        result = await db.delivery_zones.update_one({"_id": __import__("bson").ObjectId(zone_id)}, {"$set": update_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Delivery zone not found")
        return {"success": True, "message": "Delivery zone updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{zone_id}", dependencies=[Depends(verify_admin)])
async def delete_delivery_zone(zone_id: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        result = await db.delivery_zones.delete_one({"_id": __import__("bson").ObjectId(zone_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Delivery zone not found")
        return {"success": True, "message": "Delivery zone deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
