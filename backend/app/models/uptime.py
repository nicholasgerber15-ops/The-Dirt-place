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
from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class UptimeStatus(str, enum.Enum):
    UP = "up"
    DOWN = "down"
    SLOW = "slow"
    ERROR = "error"


class UptimeLog(Base):
    __tablename__ = "uptime_logs"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    status = Column(Enum(UptimeStatus), nullable=False)
    response_time_ms = Column(Integer)
    status_code = Column(Integer)
    response_body = Column(Text)
    error_message = Column(Text)
    checked_at = Column(DateTime, default=datetime.utcnow, index=True)

    site = relationship("Site", backref="uptime_logs")


class UptimeSummary(Base):
    __tablename__ = "uptime_summaries"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    uptime_percent = Column(Float, default=0.0)
    avg_response_ms = Column(Float, default=0.0)
    total_checks = Column(Integer, default=0)
    failed_checks = Column(Integer, default=0)
    downtime_minutes = Column(Float, default=0.0)

    site = relationship("Site", backref="uptime_summaries")
