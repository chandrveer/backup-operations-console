import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, DateTime, Float, Integer, Boolean, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship

from .database import Base


def gen_id() -> str:
    return str(uuid.uuid4())


class AssetType(str, enum.Enum):
    VM = "VM"
    PHYSICAL_SERVER = "Physical Server"
    DATABASE = "Database"
    FILE_SHARE = "File Share"
    CLOUD_INSTANCE = "Cloud Instance"
    APPLICATION = "Application"


class JobStatus(str, enum.Enum):
    SUCCESS = "Success"
    FAILED = "Failed"
    RUNNING = "Running"
    SKIPPED = "Skipped"
    WARNING = "Warning"


class AlertType(str, enum.Enum):
    BACKUP_FAILURE = "Backup Failure"
    SLA_VIOLATION = "SLA Violation"
    RPO_VIOLATION = "RPO Violation"
    MISSING_BACKUP = "Missing Backup"
    CONNECTOR_FAILURE = "Connector/API Failure"
    REPOSITORY_ISSUE = "Repository/Storage Issue"


class AlertSeverity(str, enum.Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class AlertStatus(str, enum.Enum):
    OPEN = "Open"
    ACKNOWLEDGED = "Acknowledged"
    RESOLVED = "Resolved"


class ConnectionStatus(str, enum.Enum):
    HEALTHY = "Healthy"
    DEGRADED = "Degraded"
    DOWN = "Down"


class Platform(Base):
    """A configured backup platform / connector instance (Rubrik, Veeam, ...)."""
    __tablename__ = "platforms"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)          # "Rubrik Security Cloud"
    vendor_key = Column(String, nullable=False)     # "rubrik" | "veeam" | "commvault" | "azure_backup"
    connection_status = Column(Enum(ConnectionStatus), default=ConnectionStatus.HEALTHY)
    last_sync_at = Column(DateTime, default=datetime.utcnow)
    last_sync_duration_ms = Column(Integer, default=0)
    api_latency_ms = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    endpoint = Column(String, nullable=True)
    is_mock = Column(Boolean, default=True)

    assets = relationship("Asset", back_populates="platform")
    jobs = relationship("Job", back_populates="platform")


class Application(Base):
    __tablename__ = "applications"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False, unique=True)   # "Finance", "HR Payroll", ...
    owner = Column(String, nullable=True)
    criticality = Column(String, default="Medium")        # Critical/High/Medium/Low

    assets = relationship("Asset", back_populates="application")


class Asset(Base):
    """Canonical, normalized representation of a protected server/VM/DB/app."""
    __tablename__ = "assets"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False, index=True)
    asset_type = Column(Enum(AssetType), nullable=False)
    environment = Column(String, default="Production")

    application_id = Column(String, ForeignKey("applications.id"))
    platform_id = Column(String, ForeignKey("platforms.id"))

    policy_name = Column(String, nullable=True)
    sla_name = Column(String, nullable=True)
    rpo_hours = Column(Float, default=24)
    rto_hours = Column(Float, default=4)
    retention_days = Column(Integer, default=30)
    replication_enabled = Column(Boolean, default=False)
    replication_target = Column(String, nullable=True)

    last_successful_backup_at = Column(DateTime, nullable=True)
    last_backup_status = Column(Enum(JobStatus), default=JobStatus.SUCCESS)
    owner = Column(String, nullable=True)
    tags = Column(String, nullable=True)  # comma-separated

    external_id = Column(String, nullable=True)  # ID in source platform

    application = relationship("Application", back_populates="assets")
    platform = relationship("Platform", back_populates="assets")
    jobs = relationship("Job", back_populates="asset")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=gen_id)
    job_name = Column(String, nullable=False)
    asset_id = Column(String, ForeignKey("assets.id"))
    platform_id = Column(String, ForeignKey("platforms.id"))

    policy_name = Column(String, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    status = Column(Enum(JobStatus), nullable=False)
    failure_reason = Column(String, nullable=True)
    rpo_hours = Column(Float, default=24)
    owner = Column(String, nullable=True)
    bytes_transferred_gb = Column(Float, default=0)
    duration_seconds = Column(Integer, default=0)

    asset = relationship("Asset", back_populates="jobs")
    platform = relationship("Platform", back_populates="jobs")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=gen_id)
    alert_type = Column(Enum(AlertType), nullable=False)
    severity = Column(Enum(AlertSeverity), nullable=False)
    status = Column(Enum(AlertStatus), default=AlertStatus.OPEN)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    asset_id = Column(String, ForeignKey("assets.id"), nullable=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=True)
    platform_id = Column(String, ForeignKey("platforms.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    asset = relationship("Asset")
    job = relationship("Job")
    platform = relationship("Platform")
