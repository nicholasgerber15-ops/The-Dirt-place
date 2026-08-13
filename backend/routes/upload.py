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
import uuid
import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import Optional
from backend.routes.admin import verify_admin
from backend.utils.r2 import upload_file

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/upload-image", dependencies=[Depends(verify_admin)])
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    key = f"products/{uuid.uuid4().hex}.{ext}"

    contents = await file.read()
    url = upload_file(contents, key, file.content_type)

    if not url:
        raise HTTPException(status_code=500, detail="Failed to upload image")

    return {"success": True, "url": url}


@router.post("/upload-file", dependencies=[Depends(verify_admin)])
async def upload_file(file: UploadFile = File(...)):
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "bin"
    key = f"files/{uuid.uuid4().hex}.{ext}"

    contents = await file.read()
    url = upload_file(contents, key, file.content_type or "application/octet-stream")

    if not url:
        raise HTTPException(status_code=500, detail="Failed to upload file")

    return {"success": True, "url": url}
