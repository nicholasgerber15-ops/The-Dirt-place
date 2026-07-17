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
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, JSON, ForeignKey
from sqlalchemy.orm import relationship
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
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
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

    tenant = relationship("Tenant", backref="sites")
