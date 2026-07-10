from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class ScanType(str, enum.Enum):
    SSL = "ssl"
    HEADERS = "headers"
    VULNERABILITY = "vulnerability"
    WORDPRESS = "wordpress"
    PERFORMANCE = "performance"
    FULL = "full"


class ScanSeverity(str, enum.Enum):
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SecurityScan(Base):
    __tablename__ = "security_scans"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    scan_type = Column(Enum(ScanType), nullable=False)
    status = Column(String(50), default="pending")
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    score = Column(Float)
    summary = Column(Text)
    findings = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    site = relationship("Site", backref="security_scans")


class SecurityFinding(Base):
    __tablename__ = "security_findings"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("security_scans.id"), nullable=False, index=True)
    severity = Column(Enum(ScanSeverity), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    recommendation = Column(Text)
    cve_id = Column(String(50))
    affected_url = Column(String(500))
    raw_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    scan = relationship("SecurityScan", backref="finding_details")
