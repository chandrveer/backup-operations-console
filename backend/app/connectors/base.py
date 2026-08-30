"""
Connector Layer — base contract.

Every backup platform (Rubrik, Veeam, Commvault, Azure Backup, or anything
added later) implements this interface. Today the implementations return
mock data. To go live, swap the body of `fetch_assets` / `fetch_jobs` /
`health_check` for real API calls — the rest of the pipeline
(normalization, DB, rules engine, API, UI) does not change.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional


@dataclass
class RawAsset:
    """Vendor-shaped asset record, pre-normalization."""
    external_id: str
    name: str
    native_type: str          # vendor's own type string, e.g. "VirtualMachine", "MSSQL"
    application: str
    environment: str
    policy_name: str
    sla_name: str
    rpo_hours: float
    rto_hours: float
    retention_days: int
    replication_enabled: bool
    replication_target: Optional[str]
    owner: str
    tags: List[str] = field(default_factory=list)


@dataclass
class RawJob:
    """Vendor-shaped job/session record, pre-normalization."""
    external_asset_id: str
    job_name: str
    policy_name: str
    start_time: datetime
    end_time: Optional[datetime]
    native_status: str        # vendor's own status string
    failure_reason: Optional[str]
    rpo_hours: float
    owner: str
    duration_seconds: int
    bytes_transferred_gb: float


@dataclass
class ConnectorHealth:
    connection_status: str    # Healthy | Degraded | Down
    latency_ms: int
    error_message: Optional[str] = None


class BaseConnector(ABC):
    vendor_key: str = "base"
    display_name: str = "Base Connector"

    def __init__(self, endpoint: Optional[str] = None, api_key: Optional[str] = None):
        self.endpoint = endpoint
        self.api_key = api_key

    @abstractmethod
    def health_check(self) -> ConnectorHealth:
        """Verify connectivity to the platform's API/management console."""
        raise NotImplementedError

    @abstractmethod
    def fetch_assets(self) -> List[RawAsset]:
        """Return every protected object known to this platform."""
        raise NotImplementedError

    @abstractmethod
    def fetch_jobs(self, lookback_hours: int = 72) -> List[RawJob]:
        """Return job/session history for the lookback window."""
        raise NotImplementedError
