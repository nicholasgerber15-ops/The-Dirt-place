from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
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


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class CalculatorRequest(BaseModel):
    project_type: str
    length: float
    width: float
    depth: float
    material: str

class CalculatorResponse(BaseModel):
    cubic_yards: float
    tons: float
    project_type: str
    material: str
    length: float
    width: float
    depth: float

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

@api_router.post("/calculator", response_model=CalculatorResponse)
async def calculate_material(request: CalculatorRequest):
    """
    Calculate material needed based on dimensions
    Converts cubic feet to cubic yards and estimates tons
    """
    # Calculate cubic feet
    cubic_feet = request.length * request.width * (request.depth / 12)
    
    # Convert to cubic yards (1 cubic yard = 27 cubic feet)
    cubic_yards = cubic_feet / 27
    
    # Material density (tons per cubic yard) - approximate values
    material_density = {
        'Topsoil': 1.3,
        'Gravel': 1.4,
        'Sand': 1.3,
        'Road Base': 1.5,
        'Mulch': 0.6,
        'Decorative Rock': 1.6
    }
    
    density = material_density.get(request.material, 1.3)
    tons = cubic_yards * density
    
    return CalculatorResponse(
        cubic_yards=round(cubic_yards, 2),
        tons=round(tons, 2),
        project_type=request.project_type,
        material=request.material,
        length=request.length,
        width=request.width,
        depth=request.depth
    )

# Include the routers in the main app
app.include_router(api_router)
app.include_router(contact_router, prefix="/api")
app.include_router(ecommerce_router, prefix="/api/ecommerce")
app.include_router(admin_router, prefix="/api/admin")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
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