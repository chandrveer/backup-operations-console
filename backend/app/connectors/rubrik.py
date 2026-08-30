"""
Rubrik / Rubrik Security Cloud connector.

Real implementation notes (for later):
  - Auth: OAuth2 client-credentials against RSC GraphQL API, or session token
    against a CDM cluster's REST API (`/api/v1/...`).
  - Assets: GraphQL `vmwareVmsConnection`, `mssqlDatabasesConnection`, etc.
  - Jobs: `activitySeriesConnection` / `eventSeriesConnection` for backup
    (Snapshot), replication, and archival activity.
  - Health: a lightweight `clusterConnectionStatus` or `/api/v1/cluster/me` call.
"""
import random
from datetime import timedelta

from .base import BaseConnector, ConnectorHealth, RawAsset, RawJob
from .mock_utils import make_asset, make_job_history

NATIVE_STATUSES = {"Success": 78, "Failure": 8, "Running": 6, "Canceled": 3, "Queued": 5}
FAILURE_REASONS = [
    "Snapshot exceeded configured SLA window",
    "Unable to quiesce VM — VMware Tools not responding",
    "Storage array snapshot API timeout",
    "CDM node unreachable during backup window",
    "Change block tracking reset required",
]
SLA_NAMES = ["Gold-1H", "Gold-4H", "Silver-24H", "Bronze-48H"]
REPLICATION_TARGETS = ["Rubrik DR Cluster - East", "Rubrik DR Cluster - West", "Rubrik Cloud Vault (AWS)"]


class RubrikConnector(BaseConnector):
    vendor_key = "rubrik"
    display_name = "Rubrik Security Cloud"

    def health_check(self) -> ConnectorHealth:
        return ConnectorHealth(connection_status="Healthy", latency_ms=random.randint(80, 220))

    def fetch_assets(self, count: int = 140):
        assets = []
        for i in range(1, count + 1):
            native_type = random.choice(["VMware VM", "MSSQL Database", "Oracle Database", "NAS Share"])
            assets.append(make_asset("RBK-VM" if native_type == "VMware VM" else "RBK-DB", i,
                                      native_type, "Rubrik", SLA_NAMES, REPLICATION_TARGETS))
        return assets

    def fetch_jobs(self, assets=None, lookback_hours: int = 72):
        assets = assets or self.fetch_assets()
        jobs = []
        for a in assets:
            jobs += make_job_history(a, NATIVE_STATUSES, FAILURE_REASONS, lookback_hours)
        return jobs
