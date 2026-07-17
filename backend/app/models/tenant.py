from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean
from app.core.database import Base
import enum


class TenantStatus(str, enum.Enum):
    ACTIVE = "active"
    PAST_DUE = "past_due"
    SUSPENDED = "suspended"


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    domain = Column(String(255), nullable=True)
    status = Column(Enum(TenantStatus), default=TenantStatus.ACTIVE, nullable=False)
    plan = Column(String(50), default="basic")
    stripe_customer_id = Column(String(255), nullable=True)
    stripe_subscription_id = Column(String(255), nullable=True)
    stripe_connect_account_id = Column(String(255), nullable=True)
    stripe_api_key_encrypted = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
