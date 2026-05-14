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
from routes.contact import router as contact_router
from routes.ecommerce import router as ecommerce_router
from routes.admin import router as admin_router
from routes.auth import router as auth_router
from routes.scheduling import router as scheduling_router
from routes.upload import router as upload_router


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# MongoDB connection with error handling
db = None
client = None

def get_db():
    global db, client
    if db is not None:
        return db
    
    # Check for both spellings (MONGO_URL vs MONGO_URL)
    mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    if not mongo_url or not db_name:
        logger.warning("MONGO_URL or DB_NAME not set - running in demo mode")
        return None
    
    try:
        # Standard username/password authentication only
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        logger.info(f"MongoDB configured for: {db_name}")
        return db
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        return None

# Create the main app without a prefix
app = FastAPI(
    title="The Dirt Place API",
    description="Backend API for The Dirt Place landscape materials",
    version="2.0.0"
)

# Add GZip compression for faster responses
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add security middleware
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    # CSP - Allow Cloudflare scripts and inline styles
    r2_domain = os.environ.get('R2_PUBLIC_URL', '').split('//')[-1].split('/')[0] if os.environ.get('R2_PUBLIC_URL') else ''
    response.headers["Content-Security-Policy"] = f"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://theboernedirtplace.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: https://*.r2.cloudflarestorage.com {r2_domain}; connect-src 'self' https://theboernedirtplace.com https://the-dirt-place-backend.onrender.com; worker-src 'self' blob:;"
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
    database = get_db()
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
    database = get_db()
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
app.include_router(auth_router)  # Already has /api/auth prefix
app.include_router(scheduling_router)  # Already has /api/scheduling prefix
app.include_router(upload_router, prefix="/api/admin")

# Security middleware for headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    # HSTS (only in production with HTTPS)
    if not os.environ.get('DEV_MODE'):
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# HTTPS redirect middleware
@app.middleware("http")
async def https_redirect(request: Request, call_next):
    # Only redirect in production (not local development)
    if not os.environ.get('DEV_MODE'):
        if request.url.scheme == "http":
            https_url = request.url.replace(scheme="https")
            from fastapi.responses import RedirectResponse
            return RedirectResponse(url=str(https_url), status_code=301)
    return await call_next(request)

# Always include necessary origins, merge with env var if set
_default_origins = [
    'https://theboernedirtplace.com',
    'https://the-dirt-place.onrender.com',
    'https://the-dirt-place-frontend.onrender.com',
    'https://the-dirt-place-backend.onrender.com',
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
