from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, JSON
from app.core.database import Base
import enum


class SiteType(str, enum.Enum):
    WORDPRESS = "wordpress"
    GENERIC = "generic"
    CLOUD = "cloud"
    CUSTOM_APP = "custom_app"


class SiteStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    DEGRADED = "degraded"
    UNKNOWN = "unknown"


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    site_type = Column(Enum(SiteType), default=SiteType.GENERIC)
    status = Column(Enum(SiteStatus), default=SiteStatus.UNKNOWN)
    description = Column(Text)
    ip_address = Column(String(45))
    hosting_provider = Column(String(255))
    cms_version = Column(String(50))
    ssl_expiry = Column(DateTime)
    last_checked = Column(DateTime)
    last_uptime_response_ms = Column(Integer)
    monitor_enabled = Column(Boolean, default=True)
    check_interval_seconds = Column(Integer, default=60)
    config = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
