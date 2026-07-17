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
from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class UpdateType(str, enum.Enum):
    CMS = "cms"
    PLUGIN = "plugin"
    THEME = "theme"
    DEPENDENCY = "dependency"
    SECURITY_PATCH = "security_patch"


class UpdateStatus(str, enum.Enum):
    PENDING = "pending"
    AVAILABLE = "available"
    APPLIED = "applied"
    FAILED = "failed"
    SKIPPED = "skipped"


class SiteUpdate(Base):
    __tablename__ = "site_updates"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    update_type = Column(Enum(UpdateType), nullable=False)
    name = Column(String(255), nullable=False)
    current_version = Column(String(50))
    available_version = Column(String(50))
    status = Column(Enum(UpdateStatus), default=UpdateStatus.PENDING)
    is_security_update = Column(Integer, default=0)
    auto_apply = Column(Integer, default=0)
    applied_at = Column(DateTime)
    applied_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    site = relationship("Site", backref="updates")
    applied_by = relationship("User", backref="applied_updates")
