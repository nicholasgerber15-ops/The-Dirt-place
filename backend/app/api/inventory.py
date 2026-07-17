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
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional
from app.services.r2 import r2

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("/images")
async def list_images(prefix: str = "inventory/"):
    return {"images": r2.list_inventory(prefix)}

@router.post("/images")
async def upload_image(file: UploadFile = File(...)):
    contents = await file.read()
    url = r2.upload_file(
        file_bytes=contents,
        filename=file.filename or "image.jpg",
        content_type=file.content_type or "image/jpeg",
    )
    if not url:
        raise HTTPException(status_code=500, detail="R2 not configured or upload failed")
    return {"url": url, "filename": file.filename}
