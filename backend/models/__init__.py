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
from datetime import datetime
from typing import Dict, List, Optional, Any
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

from backend.models.material import MaterialCreate, MaterialUpdate, MaterialResponse, PriceHistoryEntry, MaterialStatus, PricingUnit


class MaterialRepository:
    def __init__(self, db):
        self.db = db
        self.collection = db["materials"]
        self.price_history = db["material_price_history"]

    async def list_materials(self, status_filter: Optional[MaterialStatus] = None, category: Optional[str] = None, search: Optional[str] = None, limit: int = 100, skip: int = 0) -> List[dict]:
        query: Dict[str, Any] = {}
        if status_filter:
            query["status"] = status_filter.value
        if category:
            query["category"] = category
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"slug": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
            ]
        cursor = self.collection.find(query).sort("display_order", 1).skip(skip).limit(limit)
        results = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            results.append(doc)
        return results

    async def get_by_id(self, material_id: str) -> Optional[dict]:
        if not ObjectId.is_valid(material_id):
            return None
        doc = await self.collection.find_one({"_id": ObjectId(material_id)})
        if not doc:
            return None
        doc["id"] = str(doc.pop("_id"))
        return doc

    async def get_by_slug(self, slug: str) -> Optional[dict]:
        doc = await self.collection.find_one({"slug": slug})
        if not doc:
            return None
        doc["id"] = str(doc.pop("_id"))
        return doc

    async def create(self, material: MaterialCreate, actor: str) -> dict:
        now = datetime.utcnow()
        payload = material.model_dump()
        payload.update({
            "created_at": now,
            "updated_at": now,
            "published_at": None,
            "version": 1,
        })
        result = await self.collection.insert_one(payload)
        doc = await self.get_by_id(str(result.inserted_id))
        await self._record_price_history(str(result.inserted_id), None, material.pricing.retail_price, None, material.pricing.contractor_price, actor, "Created material")
        return doc

    async def update(self, material_id: str, updates: MaterialUpdate, actor: str, expected_version: Optional[int] = None) -> Optional[dict]:
        if not ObjectId.is_valid(material_id):
            return None
        existing = await self.collection.find_one({"_id": ObjectId(material_id)})
        if not existing:
            return None
        if expected_version is not None and existing.get("version", 1) != expected_version:
            return None
        update_data = updates.model_dump(exclude_unset=True)
        if not update_data:
            return await self.get_by_id(material_id)
        if "pricing" in update_data:
            old_pricing = existing.get("pricing", {})
            new_pricing = update_data.pop("pricing")
            await self._record_price_history(
                material_id,
                old_pricing.get("retail_price"),
                new_pricing.get("retail_price"),
                old_pricing.get("contractor_price"),
                new_pricing.get("contractor_price"),
                actor,
                "Price/material update",
            )
        update_data["updated_at"] = datetime.utcnow()
        if "version" not in update_data:
            update_data["version"] = existing.get("version", 1) + 1
        if update_data.get("status") == MaterialStatus.published.value and not existing.get("published_at"):
            update_data["published_at"] = datetime.utcnow()
        await self.collection.update_one({"_id": ObjectId(material_id)}, {"$set": update_data})
        return await self.get_by_id(material_id)

    async def delete(self, material_id: str) -> bool:
        if not ObjectId.is_valid(material_id):
            return False
        result = await self.collection.delete_one({"_id": ObjectId(material_id)})
        return result.deleted_count == 1

    async def _record_price_history(self, material_id: str, previous_retail_price: Optional[float], new_retail_price: Optional[float], previous_contractor_price: Optional[float], new_contractor_price: Optional[float], changed_by: str, reason: str):
        entry = PriceHistoryEntry(
            material_id=material_id,
            previous_retail_price=previous_retail_price or 0.0,
            new_retail_price=new_retail_price or 0.0,
            previous_contractor_price=previous_contractor_price,
            new_contractor_price=new_contractor_price,
            changed_by=changed_by,
            changed_at=datetime.utcnow(),
            reason=reason,
        )
        await self.price_history.insert_one(entry.model_dump())

    async def public_materials(self, limit: int = 200, skip: int = 0) -> List[dict]:
        query = {"status": MaterialStatus.published.value}
        cursor = self.collection.find(query).sort("display_order", 1).skip(skip).limit(limit)
        results = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            results.append(doc)
        return results

    async def public_material_by_slug(self, slug: str) -> Optional[dict]:
        doc = await self.collection.find_one({"slug": slug, "status": MaterialStatus.published.value})
        if not doc:
            return None
        doc["id"] = str(doc.pop("_id"))
        return doc
