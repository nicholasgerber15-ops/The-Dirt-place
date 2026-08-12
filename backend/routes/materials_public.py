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
from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

from backend.models.material import MaterialResponse, MaterialStatus

logger = ...  # use standard logging import in actual file
router = APIRouter(prefix="/api/materials", tags=["Public Materials"])


def get_collection():
    import os
    from motor.motor_asyncio import AsyncIOMotorClient
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    if not mongo_url or not db_name:
        raise HTTPException(status_code=503, detail="Database not configured")
    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
    db = client[db_name]
    return db["materials"]


@router.get("", response_model=dict)
async def list_public_materials():
    coll = get_collection()
    cursor = coll.find({"status": MaterialStatus.published.value}).sort("display_order", 1).limit(500)
    results = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        results.append(doc)
    return {"materials": results}


@router.get("/{slug}", response_model=dict)
async def get_public_material(slug: str):
    coll = get_collection()
    doc = await coll.find_one({"slug": slug, "status": MaterialStatus.published.value})
    if not doc:
        raise HTTPException(status_code=404, detail="Material not found")
    doc["id"] = str(doc.pop("_id"))
    return doc
