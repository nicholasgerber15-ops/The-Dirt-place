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
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class SecretRedaction(str, Enum):
    REDACTED = "redacted"
    PLAINTEXT = "plaintext"


class StripeConnectRequest(BaseModel):
    api_key: str
    connect_account: bool = False


class StripeConnectStatusResponse(BaseModel):
    connected: bool
    stripe_connect_account_id: Optional[str] = None
    last_four: Optional[str] = None


# --- Auth ---

class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None
    role: str = "viewer"


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str


# --- Sites ---

class SiteCreate(BaseModel):
    name: str
    url: str
    site_type: str = "generic"
    description: Optional[str] = None
    hosting_provider: Optional[str] = None
    monitor_enabled: bool = True
    check_interval_seconds: int = 60
    config: dict = {}


class SiteUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    site_type: Optional[str] = None
    description: Optional[str] = None
    hosting_provider: Optional[str] = None
    monitor_enabled: Optional[bool] = None
    check_interval_seconds: Optional[int] = None
    config: Optional[dict] = None


class SiteResponse(BaseModel):
    id: int
    name: str
    url: str
    site_type: str
    status: str
    description: Optional[str]
    ip_address: Optional[str]
    hosting_provider: Optional[str]
    ssl_expiry: Optional[datetime]
    last_checked: Optional[datetime]
    last_uptime_response_ms: Optional[int]
    monitor_enabled: bool
    check_interval_seconds: int
    config: dict
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Tickets ---

class TicketCreate(BaseModel):
    title: str
    description: str
    priority: str = "medium"
    category: str = "other"
    site_id: Optional[int] = None
    assigned_to_id: Optional[int] = None
    tags: List[str] = []


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    assigned_to_id: Optional[int] = None
    tags: Optional[List[str]] = None


class TicketCommentCreate(BaseModel):
    content: str
    is_internal: bool = False


class TicketResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    priority: str
    category: str
    site_id: Optional[int]
    assigned_to_id: Optional[int]
    created_by_id: int
    resolved_at: Optional[datetime]
    closed_at: Optional[datetime]
    tags: list
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Security ---

class ScanRequest(BaseModel):
    site_id: int
    scan_type: str = "full"


class SecurityFindingResponse(BaseModel):
    id: int
    severity: str
    title: str
    description: Optional[str]
    recommendation: Optional[str]
    cve_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ScanResponse(BaseModel):
    id: int
    site_id: int
    scan_type: str
    status: str
    score: Optional[float]
    summary: Optional[str]
    findings: list
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Monitoring ---

class UptimeCheckRequest(BaseModel):
    site_id: int


class UptimeLogResponse(BaseModel):
    id: int
    site_id: int
    status: str
    response_time_ms: Optional[int]
    status_code: Optional[int]
    error_message: Optional[str]
    checked_at: datetime

    class Config:
        from_attributes = True


class UptimeStatsResponse(BaseModel):
    uptime_percent: float
    avg_response_ms: int
    total_checks: int
    failed_checks: int
    downtime_minutes: float


# --- AI Chat ---

class ChatMessage(BaseModel):
    message: str
    session_id: str


class ChatResponse(BaseModel):
    response: str
    session_id: str


# --- Dashboard ---

class DashboardStats(BaseModel):
    total_sites: int
    online_sites: int
    offline_sites: int
    open_tickets: int
    critical_tickets: int
    active_alerts: int
    avg_uptime: float
    avg_response_time: int
    recent_scans: int
