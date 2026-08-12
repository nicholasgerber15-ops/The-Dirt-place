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
from fastapi import FastAPI, APIRouter, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.gzip import GZipMiddleware
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone
from backend.routes.contact import router as contact_router
from backend.routes.ecommerce import router as ecommerce_router
from backend.routes.admin import router as admin_router
from backend.routes.auth import router as auth_router
from backend.routes.scheduling import router as scheduling_router
from backend.routes.materials import router as admin_materials_router
from backend.routes.materials_public import router as public_materials_router
from backend.routes.upload import router as upload_router
from backend.routes.quickbooks import router as quickbooks_router
from backend.routes.delivery_zones import router as delivery_zones_router


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# MongoDB connection with error handling
db = None
client = None
demo_mode = False

async def get_db():
    global db, client, demo_mode
    if demo_mode:
        return None
    if db is not None:
        return db
    
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    if not mongo_url or not db_name:
        logger.warning("MONGO_URL or DB_NAME not set - running in demo mode")
        demo_mode = True
        return None
    
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        db = client[db_name]
        logger.info(f"Connected to MongoDB: {db_name}")
        return db
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        client = None
        db = None
        demo_mode = True
        return None

# Create the main app without a prefix
app = FastAPI(
    title="The Dirt Place API",
    description="Backend API for The Dirt Place landscape materials",
    version="2.0.0"
)

# Add GZip compression for faster responses
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Consolidated security headers middleware
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    r2_domain = os.environ.get('R2_PUBLIC_URL', '').split('//')[-1].split('/')[0] if os.environ.get('R2_PUBLIC_URL') else ''
    backend_host = request.headers.get('host', '').split(':')[0]
    ph_host = 'us.i.posthog.com'
    connect_origins = ','.join(sorted({x.strip() for x in f"{backend_host} {ph_host} theboernedirtplace.com".split() if x.strip()}))
    response.headers["Content-Security-Policy"] = f"default-src 'none'; frame-src 'self' https://challenges.cloudflare.com https://*.posthog.com; frame-ancestors 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://theboernedirtplace.com {ph_host} https://*.posthog.com; style-src 'self' 'unsafe-inline' https://theboernedirtplace.com; img-src 'self' data: https: https://*.r2.cloudflarestorage.com {r2_domain}; connect-src 'self' {connect_origins}; worker-src 'self' blob:;"
    if not os.environ.get('DEV_MODE'):
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


@api_router.get("/health")
async def health_check():
    return {"status": "ok", "service": "dirt-place-api"}


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    database = await get_db()
    if database is None:
        return StatusCheck(id=str(uuid.uuid4()), client_name=input.client_name, timestamp=datetime.now(timezone.utc))
    
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await database.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    database = await get_db()
    if database is None:
        return []
    # Exclude MongoDB's _id field from the query results
    status_checks = await database.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the routers in the main app
app.include_router(api_router)
app.include_router(contact_router, prefix="/api")
app.include_router(ecommerce_router, prefix="/api/ecommerce")
app.include_router(admin_router, prefix="/api/admin")
app.include_router(admin_materials_router, prefix="/api/admin")
app.include_router(public_materials_router, prefix="/api")
app.include_router(auth_router)  # Already has /api/auth prefix
app.include_router(scheduling_router)  # Already has /api/scheduling prefix
if upload_router:
    app.include_router(upload_router, prefix="/api/admin")
app.include_router(quickbooks_router, prefix="/api/admin/quickbooks")
app.include_router(delivery_zones_router, prefix="/api/admin")

@app.options("/{full_path:path}")
async def options_preflight(request: Request, full_path: str):
    return JSONResponse(content=None, status_code=204, headers={"Allow": "OPTIONS, GET, POST, PUT, DELETE"})

# Always include necessary origins, merge with env var if set
_default_origins = [
    'https://theboernedirtplace.com',
    'https://www.theboernedirtplace.com',
    'https://the-dirt-place.onrender.com',
    'https://the-dirt-place-frontend.onrender.com',
    'https://the-dirt-place-backend.onrender.com',
    'https://the-dirt-place-1.onrender.com',
]
_env_origins = os.environ.get('CORS_ORIGINS', '').split(',') if os.environ.get('CORS_ORIGINS') else []
_cors_origins = list(dict.fromkeys(_default_origins + _env_origins))  # deduplicate, preserve order

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_cors_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["Authorization"],
    max_age=86400
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db_check():
    global db, client, demo_mode
    mongo_url = os.environ.get('MONGO_URL')
    if not mongo_url:
        demo_mode = True
        return
    try:
        test_client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        await test_client.admin.command('ping')
        logger.info("MongoDB connection verified at startup")
    except Exception as e:
        logger.warning(f"MongoDB unavailable at startup: {e} - running in demo mode")
        os.environ['FORCE_DEMO'] = 'true'
        demo_mode = True
        db = None
        client = None

@app.on_event("shutdown")
async def shutdown_db_client():
    if client:
        client.close()
