from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class PlatformOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    vendor_key: str
    connection_status: str
    last_sync_at: Optional[datetime]
    last_sync_duration_ms: int
    api_latency_ms: int
    error_message: Optional[str]
    is_mock: bool


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    owner: Optional[str]
    criticality: str


class AssetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    asset_type: str
    environment: str
    application_name: Optional[str] = None
    platform_name: Optional[str] = None
    policy_name: Optional[str]
    sla_name: Optional[str]
    rpo_hours: float
    rto_hours: float
    retention_days: int
    replication_enabled: bool
    replication_target: Optional[str]
    last_successful_backup_at: Optional[datetime]
    last_backup_status: str
    owner: Optional[str]
    tags: Optional[str]


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    job_name: str
    asset_id: Optional[str]
    asset_name: Optional[str] = None
    application_name: Optional[str] = None
    platform_name: Optional[str] = None
    policy_name: Optional[str]
    start_time: datetime
    end_time: Optional[datetime]
    status: str
    failure_reason: Optional[str]
    rpo_hours: float
    owner: Optional[str]
    duration_seconds: int
    bytes_transferred_gb: float
    last_successful_backup_at: Optional[datetime] = None


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    alert_type: str
    severity: str
    status: str
    title: str
    description: Optional[str]
    asset_name: Optional[str] = None
    platform_name: Optional[str] = None
    created_at: datetime
    acknowledged_at: Optional[datetime]
    resolved_at: Optional[datetime]


class DashboardSummary(BaseModel):
    total_assets: int
    successful_backups_24h: int
    failed_backups_24h: int
    running_backups: int
    skipped_backups_24h: int
    sla_breaches: int
    rpo_breaches: int
    assets_without_recent_backup: int
    open_alerts: int
    critical_alerts: int


class PlatformHealth(BaseModel):
    platform_id: str
    platform_name: str
    vendor_key: str
    connection_status: str
    total_assets: int
    success_rate_pct: float
    failed_jobs_24h: int
    sla_breaches: int
    last_sync_at: Optional[datetime]
    api_latency_ms: int


class TrendPoint(BaseModel):
    date: str
    success: int
    failed: int
    skipped: int


class AssetLineage(BaseModel):
    asset: AssetOut
    recent_jobs: List[JobOut]
    open_alerts: List[AlertOut]
