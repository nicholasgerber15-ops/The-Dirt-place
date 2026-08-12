from __future__ import annotations

import os
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient


async def _get_db():
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        return None
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        await client.admin.command("ping")
        return client[db_name]
    except Exception:
        return None


async def get_operational_config(key: str, default: Any = None) -> Any:
    """
    Read an operational setting from MongoDB site_settings (setting_type=operational),
    falling back to the corresponding env var, then to the provided default.
    """
    db = await _get_db()
    if db is not None:
        try:
            doc = await db.site_settings.find_one({"setting_type": "operational"})
            if doc and key in doc:
                return doc[key]
        except Exception:
            pass
    return os.environ.get(key.upper(), default)


async def get_all_operational_settings(defaults: dict[str, Any]) -> dict[str, Any]:
    db = await _get_db()
    if db is not None:
        try:
            doc = await db.site_settings.find_one({"setting_type": "operational"})
            if doc:
                return {**defaults, **{k: v for k, v in doc.items() if k not in ("_id", "setting_type", "created_at", "updated_at")}}
        except Exception:
            pass
    return {**defaults, **{k: os.environ.get(k.upper(), v) for k, v in defaults.items()}}
