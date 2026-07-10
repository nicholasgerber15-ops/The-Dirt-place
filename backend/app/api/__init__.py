from fastapi import APIRouter
from app.api import auth, sites, tickets, security, ai_chat, dashboard, inventory

router = APIRouter()

router.include_router(auth.router)
router.include_router(sites.router)
router.include_router(tickets.router)
router.include_router(security.router)
router.include_router(ai_chat.router)
router.include_router(dashboard.router)
router.include_router(inventory.router)
