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
import secrets
import logging
import io
import hashlib
from datetime import datetime
from typing import Optional, Tuple

from fastapi import HTTPException
from PIL import Image
import boto3
from botocore.config import Config

logger = logging.getLogger(__name__)

R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID')
R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY')
R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME', 'dirt-place-images')
R2_PUBLIC_URL = os.environ.get('R2_PUBLIC_URL')

_client = None


def get_client():
    global _client
    if _client is not None:
        return _client
    if not all([R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID]):
        return None
    _client = boto3.client(
        's3',
        endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4'),
        region_name='auto',
    )
    return _client


def public_url(key: str) -> str:
    if R2_PUBLIC_URL:
        return f"{R2_PUBLIC_URL.rstrip('/')}/{key}"
    return f"https://cdn.theboernedirtplace.com/{key}"


def _safe_key(prefix: str, filename: str) -> str:
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'bin'
    safe_name = re.sub(r'[^a-z0-9_-]', '-', filename.rsplit('.', 1)[0].lower())[:48]
    uid = secrets.token_hex(8)
    return f"{prefix.rstrip('/')}/{safe_name}-{uid}.{ext}"


def _process_image(file_bytes: bytes, content_type: str, max_bytes: int = 10 * 1024 * 1024) -> Tuple[Optional[bytes], Optional[str], Optional[Tuple[int, int]]]:
    if len(file_bytes) > max_bytes:
        raise HTTPException(status_code=400, detail="Image exceeds 10 MB limit")
    try:
        image = Image.open(io.BytesIO(file_bytes))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid image file") from exc
    if image.format not in {"JPEG", "PNG", "WEBP"}:
        raise HTTPException(status_code=400, detail="Unsupported image format")
    image = image.convert("RGB")
    width, height = image.size
    card = image.copy()
    card.thumbnail((1024, 1024))
    thumbnail = card.copy()
    thumbnail.thumbnail((320, 320))
    variants = {
        "full.webp": _encode_webp(image),
        "card.webp": _encode_webp(card),
        "thumbnail.webp": _encode_webp(thumbnail),
    }
    return variants, "image/webp", (width, height)


def _encode_webp(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, format="WEBP", quality=85, method=6)
    return buffer.getvalue()


def upload_material_image(material_id: str, file_bytes: bytes, filename: str, content_type: str, alt_text: str = "") -> Optional[dict]:
    client = get_client()
    if not client:
        logger.warning("R2 not configured")
        return None
    try:
        variants, final_type, dimensions = _process_image(file_bytes, content_type)
        if not variants:
            return None
        image_id = secrets.token_hex(12)
        keys = {name: _safe_key(f"materials/{material_id}/{image_id}", name) for name in variants}
        for name, data in variants.items():
            client.put_object(
                Bucket=R2_BUCKET_NAME,
                Key=keys[name],
                Body=data,
                ContentType=final_type,
                CacheControl="public, max-age=31536000",
            )
        primary_key = keys["full.webp"]
        urls = {name: public_url(key) for name, key in keys.items()}
        return {
            "key": primary_key,
            "url": urls["full.webp"],
            "card_url": urls["card.webp"],
            "thumbnail_url": urls["thumbnail.webp"],
            "alt_text": alt_text or "",
            "position": 0,
            "is_primary": True,
            "width": dimensions[0],
            "height": dimensions[1],
            "content_type": final_type,
            "size_bytes": len(file_bytes),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"R2 upload failed: {exc}")
        raise HTTPException(status_code=500, detail="Image upload failed")


def delete_material_image(keys: List[str]) -> bool:
    client = get_client()
    if not client:
        return False
    try:
        for key in keys:
            client.delete_object(Bucket=R2_BUCKET_NAME, Key=key)
        return True
    except Exception as exc:
        logger.error(f"R2 delete failed: {exc}")
        return False
