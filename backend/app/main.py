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
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.database import engine, Base
from app.services.mongodb import mongodb
from app.api import auth, sites, tickets, security, ai_chat, dashboard, inventory, tenants, billing

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await mongodb.connect()
    yield
    # Shutdown
    await mongodb.close()
    await engine.dispose()


app = FastAPI(
    title="SiteManager AI",
    description="AI-powered website management platform - monitoring, security, tickets, and more",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(sites.router, prefix="/api/v1")
app.include_router(tickets.router, prefix="/api/v1")
app.include_router(security.router, prefix="/api/v1")
app.include_router(ai_chat.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(inventory.router, prefix="/api/v1")
app.include_router(tenants.router, prefix="/api/v1")
app.include_router(billing.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "name": "SiteManager AI",
        "version": "1.0.0",
        "description": "AI-powered website management platform",
        "docs": "/docs",
        "endpoints": {
            "auth": "/api/v1/auth",
            "sites": "/api/v1/sites",
            "tickets": "/api/v1/tickets",
            "security": "/api/v1/security",
            "ai_chat": "/api/v1/ai",
            "dashboard": "/api/v1/dashboard",
        },
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "services": {"database": "ok", "mongodb": "ok", "llm": "ok"}}
