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
import boto3
import logging
from botocore.config import Config
from pathlib import Path

logger = logging.getLogger(__name__)

R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY')
R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME', 'the-dirt-place')
R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID')
R2_PUBLIC_URL = os.environ.get('R2_PUBLIC_URL')

_client = None

def get_r2_client():
    global _client
    if _client is not None:
        return _client

    if not all([R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID]):
        logger.warning("R2 credentials not configured")
        return None

    endpoint_url = f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com'

    _client = boto3.client(
        's3',
        endpoint_url=endpoint_url,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )
    return _client


def get_public_url(key: str) -> str:
    if R2_PUBLIC_URL:
        return f"{R2_PUBLIC_URL.rstrip('/')}/{key}"
    return f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com/{R2_BUCKET_NAME}/{key}"


def upload_file(file_bytes: bytes, key: str, content_type: str) -> str | None:
    client = get_r2_client()
    if not client:
        return None

    try:
        client.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=key,
            Body=file_bytes,
            ContentType=content_type
        )
        return get_public_url(key)
    except Exception as e:
        logger.error(f"R2 upload failed for {key}: {e}")
        return None


def delete_file(key: str) -> bool:
    client = get_r2_client()
    if not client:
        return False

    try:
        client.delete_object(Bucket=R2_BUCKET_NAME, Key=key)
        return True
    except Exception as e:
        logger.error(f"R2 delete failed for {key}: {e}")
        return False
