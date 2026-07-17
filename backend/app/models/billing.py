from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey
from app.core.database import Base
import enum


class SubscriptionStatus(str, enum.Enum):
    TRIALING = "trialing"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, unique=True, index=True)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.TRIALING, nullable=False)
    plan = Column(String(50), default="basic")
    price_cents = Column(Integer, default=4900)
    interval = Column(String(20), default="month")
    current_period_start = Column(DateTime, default=datetime.utcnow)
    current_period_end = Column(DateTime, default=datetime.utcnow)
    stripe_subscription_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True)
    amount_cents = Column(Integer, nullable=False)
    status = Column(String(50), default="open")
    stripe_invoice_id = Column(String(255), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
