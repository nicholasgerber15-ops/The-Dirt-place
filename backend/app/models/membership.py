from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class TenantUserRole(str, enum.Enum):
    TENANT_ADMIN = "tenant_admin"
    BUSINESS = "business"


class TenantUser(Base):
    __tablename__ = "tenant_users"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(Enum(TenantUserRole), default=TenantUserRole.BUSINESS, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant", backref="members")
    user = relationship("User", backref="tenant_memberships")

    __table_args__ = (
        UniqueConstraint("tenant_id", "user_id", name="uq_tenant_user"),
    )
