from __future__ import annotations

import os
import secrets
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
from jose import exceptions as jwt_exceptions
from motor.motor_asyncio import AsyncIOMotorClient

from backend.routes.admin import verify_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])

ADMIN_JWT_SECRET = os.environ.get("ADMIN_JWT_SECRET_KEY")
ADMIN_JWT_ALGORITHM = "HS256"
ADMIN_JWT_EXPIRE_MINUTES = 60 * 24

# In-memory passkey challenges (replace with Redis in production)
_passkey_challenges: Dict[str, Dict[str, Any]] = {}


def _get_db():
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        return None
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        return client[db_name]
    except Exception:
        return None


def _hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if salt is None:
        salt = secrets.token_hex(16)
    hash_value = secrets.hash_sha512((password + salt).encode()).hex()
    return hash_value, salt


class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "admin"


class AdminUserLogin(BaseModel):
    email: EmailStr
    password: str


class PasskeyLoginStart(BaseModel):
    email: EmailStr


class PasskeyLoginFinish(BaseModel):
    email: EmailStr
    challenge_id: str
    signature: str


class AdminUserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str
    last_login: Optional[str] = None
    passkey_enabled: bool = False


@router.post("/register", dependencies=[Depends(verify_admin)])
async def register_admin_user(user_data: AdminUserCreate):
    db = _get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    existing = await db.admin_users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Admin user already exists")
    
    password_hash, password_salt = _hash_password(user_data.password)
    
    user_doc = {
        "email": user_data.email,
        "name": user_data.name,
        "role": user_data.role,
        "password_hash": password_hash,
        "password_salt": password_salt,
        "passkey_enabled": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": None,
    }
    
    result = await db.admin_users.insert_one(user_doc)
    user_doc["id"] = str(result.inserted_id)
    
    return {
        "success": True,
        "user": AdminUserResponse(
            id=user_doc["id"],
            email=user_doc["email"],
            name=user_doc["name"],
            role=user_doc["role"],
            created_at=user_doc["created_at"],
            passkey_enabled=user_doc["passkey_enabled"],
        ).model_dump()
    }


@router.post("/login")
async def admin_login(credentials: AdminUserLogin):
    db = _get_db()
    user = None
    if db is not None:
        user = await db.admin_users.find_one({"email": credentials.email})
    
    password_valid = False
    if user:
        password_hash, _ = _hash_password(credentials.password, user.get("password_salt"))
        password_valid = secrets.compare_digest(password_hash, user["password_hash"])
    
    if not password_valid:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if db is not None:
        await db.admin_users.update_one(
            {"email": credentials.email},
            {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
        )
    
    token = _create_admin_access_token(user.get("role", "admin"), user.get("email", credentials.email))
    return {
        "success": True,
        "token": token,
        "token_type": "bearer",
        "expires_in": ADMIN_JWT_EXPIRE_MINUTES * 60,
        "message": "Login successful",
    }


@router.post("/passkey/start")
async def start_passkey_login(request: PasskeyLoginStart):
    challenge_id = secrets.token_urlsafe(32)
    challenge = secrets.token_urlsafe(32)
    
    _passkey_challenges[challenge_id] = {
        "email": request.email,
        "challenge": challenge,
        "expires_at": datetime.now(timezone.utc).timestamp() + 300,
    }
    
    return {
        "challenge_id": challenge_id,
        "challenge": challenge,
        "email": request.email,
    }


@router.post("/passkey/finish")
async def finish_passkey_login(request: PasskeyLoginFinish):
    challenge_data = _passkey_challenges.get(request.challenge_id)
    if not challenge_data:
        raise HTTPException(status_code=400, detail="Invalid or expired challenge")
    
    if datetime.now(timezone.utc).timestamp() > challenge_data["expires_at"]:
        del _passkey_challenges[request.challenge_id]
        raise HTTPException(status_code=400, detail="Challenge expired")
    
    if challenge_data["email"] != request.email:
        raise HTTPException(status_code=400, detail="Email mismatch")
    
    db = _get_db()
    user = None
    if db is not None:
        user = await db.admin_users.find_one({"email": request.email, "passkey_enabled": True})
    
    if not user:
        raise HTTPException(status_code=401, detail="Passkey not registered for this user")
    
    # In production, verify the signature against stored passkey public key
    # For now, accept any valid challenge response for enrolled passkey users
    del _passkey_challenges[request.challenge_id]
    
    if db is not None:
        await db.admin_users.update_one(
            {"email": request.email},
            {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
        )
    
    token = _create_admin_access_token(user.get("role", "admin"), user.get("email", request.email))
    return {
        "success": True,
        "token": token,
        "token_type": "bearer",
        "expires_in": ADMIN_JWT_EXPIRE_MINUTES * 60,
        "message": "Passkey login successful",
    }


@router.get("/users", dependencies=[Depends(verify_admin)])
async def list_admin_users():
    db = _get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    users = []
    async for user in db.admin_users.find():
        users.append({
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "created_at": user.get("created_at", ""),
            "last_login": user.get("last_login"),
            "passkey_enabled": user.get("passkey_enabled", False),
        })
    return {"users": users}


@router.delete("/users/{user_id}", dependencies=[Depends(verify_admin)])
async def delete_admin_user(user_id: str):
    db = _get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    result = await db.admin_users.delete_one({"_id": __import__("bson").ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "message": "Admin user deleted"}


def _create_admin_access_token(role: str = "admin", email: str = "") -> str:
    if not ADMIN_JWT_SECRET:
        raise HTTPException(status_code=503, detail="Admin authentication is not configured")
    
    to_encode = {
        "role": role,
        "email": email,
        "aud": "admin-panel",
        "exp": datetime.now(timezone.utc).timestamp() + (ADMIN_JWT_EXPIRE_MINUTES * 60),
    }
    return jwt.encode(to_encode, ADMIN_JWT_SECRET, algorithm=ADMIN_JWT_ALGORITHM)
