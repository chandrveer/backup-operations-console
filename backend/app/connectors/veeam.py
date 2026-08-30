"""
Veeam Backup & Replication / Veeam ONE connector.

Real implementation notes (for later):
  - Auth: OAuth2 password grant against Veeam Enterprise Manager / VBR REST API.
  - Assets: `/api/v1/inventory/...` and backup object browser endpoints.
  - Jobs: `/api/v1/sessions` (job sessions) filtered by `sessionType=Backup`.
  - Health: `/api/v1/serverInfo` reachability + auth token refresh success.
"""
import random

from .base import BaseConnector, ConnectorHealth
from .mock_utils import make_asset, make_job_history

NATIVE_STATUSES = {"Success": 75, "Failed": 9, "Running": 7, "Warning": 6, "None": 3}
FAILURE_REASONS = [
    "VSS writer failure on guest OS",
    "Backup repository out of free space",
    "Network connectivity lost to proxy server",
    "Job stopped by administrator",
    "Guest processing timeout — application-aware image failed",
]
SLA_NAMES = ["SQL-Daily", "VM-Hourly", "VM-Nightly", "Exchange-6H"]
REPLICATION_TARGETS = ["Veeam DR Site - Dallas", "Veeam Cloud Connect", "Veeam Replica - Secondary DC"]


class VeeamConnector(BaseConnector):
    vendor_key = "veeam"
    display_name = "Veeam Backup & Replication"

    def health_check(self) -> ConnectorHealth:
        return ConnectorHealth(connection_status="Healthy", latency_ms=random.randint(60, 180))

    def fetch_assets(self, count: int = 160):
        assets = []
        for i in range(1, count + 1):
            native_type = random.choice(["VMware VM", "Hyper-V VM", "MSSQL Database", "Physical Server"])
            prefix = "PROD-SQL" if native_type == "MSSQL Database" else "PROD-VM"
            assets.append(make_asset(prefix, i, native_type, "SQL" if "SQL" in native_type else "VM",
                                      SLA_NAMES, REPLICATION_TARGETS))
        return assets

    def fetch_jobs(self, assets=None, lookback_hours: int = 72):
        assets = assets or self.fetch_assets()
        jobs = []
        for a in assets:
            jobs += make_job_history(a, NATIVE_STATUSES, FAILURE_REASONS, lookback_hours)
        return jobs
