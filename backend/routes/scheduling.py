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
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta, date
import os
import json

router = APIRouter(prefix="/scheduling", tags=["scheduling"])

GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "")
THE_DIRT_PLACE_ADDRESS = "411 SA-Evans Rd, Boerne, TX 78006"
LOAD_TIME_MINUTES = 10
DELIVERY_TIME_MINUTES = 10
DRIVER_SPEED_FACTOR = 1.2  # Account for truck speed

class DeliverySlot(BaseModel):
    start_time: str
    end_time: str
    available: bool
    travel_minutes: float
    distance_miles: float

class SchedulingRequest(BaseModel):
    delivery_address: str
    date: str  # YYYY-MM-DD format
    duration_minutes: Optional[int] = 30  # Total job time (load + deliver + unload)

class SchedulingResponse(BaseModel):
    date: str
    slots: List[DeliverySlot]
    total_distance_miles: float
    total_travel_minutes: float

# In-memory storage for booked slots (in production, use Redis/DB)
booked_slots = {}

async def get_distance_matrix(origin: str, destination: str) -> dict:
    """Get distance and duration between two points using Google Maps API"""
    if not GOOGLE_MAPS_API_KEY:
        # Fallback: estimate based on Boerne area (average 20 min drive)
        return {
            "distance_miles": 15.0,
            "duration_minutes": 20.0,
            "duration_seconds": 1200.0
        }
    
    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        "origins": origin,
        "destinations": destination,
        "key": GOOGLE_MAPS_API_KEY,
        "units": "imperial",
        "traffic_model": "best_guess",
        "departure_time": "now"
    }
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params)
        data = resp.json()
    
    if data.get("status") != "OK":
        # Fallback for demo
        return {
            "distance_miles": 15.0,
            "duration_minutes": 20.0,
            "duration_seconds": 1200.0
        }
    
    element = data["rows"][0]["elements"][0]
    if element.get("status") != "OK":
        return {
            "distance_miles": 15.0,
            "duration_minutes": 20.0,
            "duration_seconds": 1200.0
        }
    
    distance_miles = element["distance"]["value"] / 1609.34  # meters to miles
    duration_seconds = element["duration"]["value"]
    
    # Apply driver speed factor (trucks drive slower)
    duration_minutes = (duration_seconds / 60) * DRIVER_SPEED_FACTOR
    
    return {
        "distance_miles": round(distance_miles, 1),
        "duration_minutes": round(duration_minutes, 1),
        "duration_seconds": duration_seconds
    }

def get_working_hours(date_str: str):
    """Get working hours for a given date (7 AM - 5 PM, closed Sunday)"""
    date = datetime.strptime(date_str, "%Y-%m-%d")
    # Sunday = 6
    if date.weekday() == 6:  # Sunday
        return None, None
    
    # Working hours: 7 AM to 5 PM
    start = date.replace(hour=7, minute=0, second=0, microsecond=0)
    end = date.replace(hour=17, minute=0, second=0, microsecond=0)
    return start, end

def generate_time_slots(
    date_str: str,
    travel_minutes: float,
    num_slots: int = 20
) -> List[DeliverySlot]:
    """Generate available time slots for a day"""
    start_time, end_time = get_working_hours(date_str)
    if not start_time:
        return []
    
    slots = []
    slot_duration = timedelta(minutes=30)  # 30-minute slots
    current = start_time
    
    # Load time at The Dirt Place before first delivery
    load_time = timedelta(minutes=LOAD_TIME_MINUTES)
    
    for i in range(num_slots):
        slot_start = current
        slot_end = current + slot_duration
        
        # Check if slot extends beyond working hours
        if slot_end > end_time:
            break
        
        # Calculate when driver would return for next slot
        # Travel to site + delivery time + travel back + load time for next
        total_time_for_slot = (
            timedelta(minutes=travel_minutes) +  # Travel to site
            timedelta(minutes=DELIVERY_TIME_MINUTES) +  # At site
            timedelta(minutes=travel_minutes) +  # Return to base
            load_time  # Load for next
        )
        
        next_available = slot_start + total_time_for_slot
        
        # Check if this slot conflicts with any booked slots
        slot_key = f"{date_str}-{slot_start.strftime('%H:%M')}"
        is_booked = booked_slots.get(slot_key, False)
        
        slots.append(DeliverySlot(
            start_time=slot_start.strftime("%I:%M %p"),
            end_time=slot_end.strftime("%I:%M %p"),
            available=not is_booked,
            travel_minutes=travel_minutes,
            distance_miles=0  # Will be set by caller
        ))
        
        current = next_available
    
    return slots

@router.get("/available-slots")
async def get_available_slots(date: str, address: str = THE_DIRT_PLACE_ADDRESS):
    """Get available delivery slots and calculate per-mile delivery fee"""
    try:
        # Validate date
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD")
    
    # Get distance from The Dirt Place to delivery address
    distance_info = await get_distance_matrix(
        THE_DIRT_PLACE_ADDRESS,
        address
    )
    
    travel_minutes = distance_info["duration_minutes"]
    distance_miles = distance_info["distance_miles"]
    
    # Calculate delivery fee (per-mile rate)
    try:
        db = get_database()
        if db is not None:
            settings = await db.delivery_settings.find_one({"setting_type": "delivery"})
            if settings:
                fee_per_mile = settings.get("fee_per_mile", 2.50)
                base_fee = settings.get("base_fee", 15.00)
                base_miles = settings.get("base_miles", 10)
                
                # Calculate: base_fee covers first X miles, then per-mile rate
                if distance_miles <= base_miles:
                    delivery_fee = base_fee
                else:
                    extra_miles = distance_miles - base_miles
                    delivery_fee = base_fee + (extra_miles * fee_per_mile)
            else:
                delivery_fee = 15.00 + max(0, distance_miles - 10) * 2.50
        else:
            # Demo mode calculation
            delivery_fee = 15.00 + max(0, distance_miles - 10) * 2.50
    except Exception as e:
        logger.error(f"Failed to calculate delivery fee: {str(e)}")
        delivery_fee = 25.00  # Default fallback
    
    # Generate slots
    slots = generate_time_slots(date, travel_minutes)
    
    # Update distance for each slot
    for slot in slots:
        slot.distance_miles = distance_miles
    
    return {
        "date": date,
        "slots": [slot.dict() for slot in slots],
        "total_distance_miles": distance_miles * 2,  # Round trip
        "total_travel_minutes": travel_minutes * 2,  # Round trip
        "delivery_fee": round(delivery_fee, 2),
        "distance_miles_one_way": distance_miles
    }

@router.post("/book-slot")
async def book_slot(date: str, time: str, order_id: str):
    """Book a delivery slot"""
    slot_key = f"{date}-{time}"
    if booked_slots.get(slot_key):
        raise HTTPException(400, "This slot is already booked")
    
    booked_slots[slot_key] = {
        "order_id": order_id,
        "booked_at": datetime.utcnow().isoformat()
    }
    return {"status": "booked", "slot": slot_key}

@router.get("/driver-schedule")
async def get_driver_schedule(date: str):
    """Get driver's schedule for a day (admin only - would need auth)"""
    start_time, end_time = get_working_hours(date)
    if not start_time:
        return {"date": date, "schedule": []}
    
    schedule = []
    current = start_time
    
    while current < end_time:
        slot_key = f"{date}-{current.strftime('%H:%M')}"
        booking = booked_slots.get(slot_key)
        
        schedule.append({
            "time": current.strftime("%I:%M %p"),
            "booked": booking is not None,
            "order_id": booking["order_id"] if booking else None
        })
        
        current += timedelta(minutes=30)
    
    return {"date": date, "schedule": schedule}

@router.get("/estimate-travel")
async def estimate_travel(address: str):
    """Quick travel time estimate from The Dirt Place to an address"""
    distance_info = await get_distance_matrix(THE_DIRT_PLACE_ADDRESS, address)
    return {
        "address": address,
        "distance_miles": distance_info["distance_miles"],
        "travel_minutes_one_way": distance_info["duration_minutes"],
        "travel_minutes_round_trip": distance_info["duration_minutes"] * 2,
        "total_job_time_minutes": (
            distance_info["duration_minutes"] * 2 +  # Round trip
            LOAD_TIME_MINUTES +  # Load at base
            DELIVERY_TIME_MINUTES  # At delivery site
        )
    }

# 📅 Calendar Models
class DeliveryConfig(BaseModel):
    timeSlots: List[str]
    daysOfWeek: List[str]
    maxDeliveriesPerSlot: int
    zones: List[str]
    drivers: List[str]

class DeliveryEvent(BaseModel):
    id: str
    orderId: str
    customer: str
    address: str
    zone: str
    date: date
    timeSlot: str
    driver: str
    items: List[str]
    status: str = "scheduled"  # scheduled | in-transit | delivered | cancelled
    weightTons: Optional[float] = None
    notes: Optional[str] = None

# 🗃️ In-Memory Data Stores
calendar_config = DeliveryConfig(
    timeSlots=["07:00-09:00", "09:00-11:00", "11:00-13:00", "13:00-15:00", "15:00-17:00"],
    daysOfWeek=["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    maxDeliveriesPerSlot=6,
    zones=["Zone A", "Zone B", "Zone C", "Zone D"],
    drivers=["Mike R.", "Carlos T.", "Sarah L.", "Route Van 1"]
)

delivery_events: Dict[str, DeliveryEvent] = {}

# 📅 Calendar Endpoints
@router.get("/calendar/config")
async def get_calendar_config():
    return calendar_config.model_dump()

@router.get("/calendar/events")
async def get_events(date_filter: Optional[date] = Query(None)):
    events = list(delivery_events.values())
    if date_filter:
        events = [e for e in events if e.date == date_filter]
    return {"events": [e.model_dump() for e in events]}

@router.post("/calendar/events")
async def create_event(event: DeliveryEvent):
    # Capacity check
    slot_events = [e for e in delivery_events.values() if e.date == event.date and e.timeSlot == event.timeSlot]
    if len(slot_events) >= calendar_config.maxDeliveriesPerSlot:
        raise HTTPException(status_code=400, detail="Time slot is at max capacity")
    
    delivery_events[event.id] = event
    return {"message": "Event scheduled", "event": event.model_dump()}

@router.patch("/calendar/events/{event_id}")
async def update_event_status(event_id: str, new_status: str = Query(...)):
    if event_id not in delivery_events:
        raise HTTPException(status_code=404, detail="Event not found")
    
    valid_statuses = ["scheduled", "in-transit", "delivered", "cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    delivery_events[event_id].status = new_status
    return {"message": "Status updated", "event": delivery_events[event_id].model_dump()}
