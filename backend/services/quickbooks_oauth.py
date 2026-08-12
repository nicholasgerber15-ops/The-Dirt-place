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
import json
import logging
from datetime import datetime
from typing import Optional

from cryptography.fernet import Fernet
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

_encryption_key = os.environ.get('QUICKBOOKS_TOKEN_ENCRYPTION_KEY')
_fernet = Fernet(_encryption_key.encode() if _encryption_key else None)


def get_db():
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    if not mongo_url or not db_name:
        return None
    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
    return client[db_name]


def encrypt_token(token: str) -> str:
    if not _fernet:
        raise RuntimeError("QUICKBOOKS_TOKEN_ENCRYPTION_KEY is not configured")
    return _fernet.encrypt(token.encode()).decode()


def decrypt_token(ciphertext: str) -> str:
    if not _fernet:
        raise RuntimeError("QUICKBOOKS_TOKEN_ENCRYPTION_KEY is not configured")
    return _fernet.decrypt(ciphertext.encode()).decode()


async def save_connection(connection) -> None:
    db = get_db()
    if not db:
        raise RuntimeError("Database not configured")
    payload = connection.model_dump()
    await db["integration_connections"].replace_one(
        {"provider": "quickbooks"},
        payload,
        upsert=True,
    )


async def load_connection() -> Optional[dict]:
    db = get_db()
    if not db:
        return None
    doc = await db["integration_connections"].find_one({"provider": "quickbooks"})
    return doc


async def delete_connection() -> bool:
    db = get_db()
    if not db:
        return False
    result = await db["integration_connections"].delete_one({"provider": "quickbooks"})
    return result.deleted_count == 1


async def append_audit_log(entry) -> None:
    db = get_db()
    if not db:
        return
    payload = entry.model_dump()
    await db["integration_audit_log"].insert_one(payload)


async def save_sync_report(report) -> None:
    db = get_db()
    if not db:
        return
    payload = report.model_dump()
    await db["integration_sync_reports"].insert_one(payload)
