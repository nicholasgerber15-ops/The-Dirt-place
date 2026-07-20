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
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from jose import exceptions as jwt_exceptions
import bcrypt
from datetime import datetime, timedelta
import os
from pymongo import MongoClient
from bson import ObjectId

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()

# JWT Settings
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-this')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

def get_database():
    MONGO_URL = os.environ.get('MONGO_URL') or os.environ.get('MONGO_URL')
    if not MONGO_URL:
        return None
    try:
        client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        db_name = os.environ.get('DB_NAME', 'the_dirt_place')
        return client[db_name]
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

def get_password_hash(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_driver(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        role = payload.get("role")
        if role != "driver":
            raise HTTPException(status_code=403, detail="Driver access required")
        return payload.get("sub")
    except jwt_exceptions.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt_exceptions.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/register")
async def register(user_data: dict):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Check if user exists
    existing = db.customers.find_one({"email": user_data['email']})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_doc = {
        "email": user_data['email'],
        "password_hash": get_password_hash(user_data['password']),
        "name": user_data.get('name', ''),
        "phone": user_data.get('phone', ''),
        "business_name": user_data.get('business_name', ''),
        "addresses": [],
        "created_at": datetime.utcnow(),
        "is_contractor": user_data.get('is_contractor', False)
    }
    
    result = db.customers.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create token
    access_token = create_access_token({"sub": user_id, "email": user_data['email']})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_data['email'],
            "name": user_data.get('name', ''),
            "is_contractor": user_data.get('is_contractor', False)
        }
    }

@router.post("/login")
async def login(credentials: dict):
    db = get_database()
    if db is None:
        # Demo mode - allow demo login
        if credentials['email'] == 'demo@thedirtplace.com' and credentials['password'] == 'demo123':
            return {
                "access_token": create_access_token({"sub": "demo_user", "email": credentials['email']}),
                "token_type": "bearer",
                "user": {
                    "id": "demo_user",
                    "email": credentials['email'],
                    "name": "Demo User",
                    "is_contractor": False
                }
            }
        raise HTTPException(status_code=500, detail="Database not available")
    
    user = db.customers.find_one({"email": credentials['email']})
    if not user or not verify_password(credentials['password'], user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token({"sub": str(user['_id']), "email": user['email']})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user['_id']),
            "email": user['email'],
            "name": user.get('name', ''),
            "is_contractor": user.get('is_contractor', False)
        }
    }

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt_exceptions.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt_exceptions.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/me")
async def get_me(user_id: str = Depends(get_current_user)):
    if user_id == "demo_user":
        return {
            "id": "demo_user",
            "email": "demo@thedirtplace.com",
            "name": "Demo User",
            "phone": "830-336-3713",
            "business_name": "",
            "is_contractor": False,
            "addresses": []
        }
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    user = db.customers.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": str(user['_id']),
        "email": user['email'],
        "name": user.get('name', ''),
        "phone": user.get('phone', ''),
        "business_name": user.get('business_name', ''),
        "is_contractor": user.get('is_contractor', False),
        "addresses": user.get('addresses', [])
    }

@router.get("/orders")
async def get_my_orders(user_id: str = Depends(get_current_user)):
    if user_id == "demo_user":
        return {
            "orders": [
                {
                    "order_number": "DEMO-001",
                    "material": "Topsoil",
                    "quantity": 5,
                    "total": 225.00,
                    "status": "delivered",
                    "created_at": datetime.utcnow().isoformat()
                }
            ]
        }
    
    db = get_database()
    if db is None:
        return {"orders": []}
    
    orders = list(db.orders.find({"customer.email": {"$exists": True}}).limit(10))
    return {
        "orders": [{
            "order_number": o.get('order_number', ''),
            "material": o.get('material', ''),
            "quantity": o.get('quantity', 0),
            "total": o.get('pricing', {}).get('total', 0),
            "status": o.get('status', ''),
            "created_at": o.get('created_at', '')
        } for o in orders]
    }

# Driver login
@router.post("/driver-login")
async def driver_login(credentials: dict):
    db = get_database()
    if db is None:
        # Demo mode
        if credentials.get('username') == 'driver' and credentials.get('password') == 'driver123':
            access_token = create_access_token({"sub": "demo_driver", "role": "driver", "name": "Demo Driver"})
            return {"access_token": access_token, "token_type": "bearer"}
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    driver = db.drivers.find_one({"username": credentials.get('username')})
    if not driver or not verify_password(credentials.get('password', ''), driver['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token({"sub": str(driver['_id']), "role": "driver", "name": driver.get('name', '')})
    return {"access_token": access_token, "token_type": "bearer"}

# Driver endpoints
@router.get("/driver/slots", dependencies=[Depends(verify_driver)])
async def get_driver_slots():
    """Get all scheduled delivery slots for drivers"""
    try:
        db = get_database()
        if db is None:
            # Demo data
            return {"slots": [
                {
                    "id": "demo1",
                    "date": datetime.utcnow().strftime('%Y-%m-%d'),
                    "time_slot": "8:00 AM - 10:00 AM",
                    "order_number": "DEMO-001",
                    "customer_name": "John Doe",
                    "address": "123 Main St, Boerne, TX 78006",
                    "material": "Topsoil",
                    "quantity": 5,
                    "phone": "830-555-0123",
                    "status": "scheduled",
                    "directions_url": "https://maps.google.com/?q=123+Main+St+Boerne+TX+78006"
                }
            ]}
        
        slots = list(db.delivery_slots.find({}).sort("date", 1).limit(50))
        for slot in slots:
            if '_id' in slot:
                del slot['_id']
            # Generate Google Maps directions URL
            if 'address' in slot:
                encoded_address = slot['address'].replace(' ', '+')
                slot['directions_url'] = f"https://maps.google.com/?q={encoded_address}"
        
        return {"slots": slots}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
