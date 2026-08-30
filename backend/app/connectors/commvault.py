"""
Commvault connector.

Real implementation notes (for later):
  - Auth: QSDK token via `/webconsole/api/Login`.
  - Assets: `/webconsole/api/Client` + `/Subclient` for protected objects.
  - Jobs: `/webconsole/api/Job` with `jobFilter=Backup`.
  - Health: token-refresh + `/webconsole/api/CommServ` reachability.

This mock connector intentionally simulates a degraded API connection some
of the time, to exercise the "Connector/API Failure" alert path — distinct
from an actual backup job failing.
"""
import random

from .base import BaseConnector, ConnectorHealth
from .mock_utils import make_asset, make_job_history

NATIVE_STATUSES = {"Completed": 74, "Failed": 10, "Running": 6, "Completed w/ errors": 7, "Killed": 3}
FAILURE_REASONS = [
    "MediaAgent unreachable",
    "Index cache corruption detected — job restarted",
    "Client not reachable / firewall block",
    "Insufficient space on library",
    "Data verification failure post-backup",
]
SLA_NAMES = ["FS-Nightly", "Exchange-4H", "AD-Daily", "SAP-Hourly"]
REPLICATION_TARGETS = ["Commvault DR Library - Secondary", "Commvault Cloud Library (Azure)"]

# Deterministic-ish simulated flakiness so the demo has something to show
# in Integrations without being different on every single request.
_SIMULATED_DEGRADED = random.random() < 0.5


class CommvaultConnector(BaseConnector):
    vendor_key = "commvault"
    display_name = "Commvault"

    def health_check(self) -> ConnectorHealth:
        if _SIMULATED_DEGRADED:
            return ConnectorHealth(
                connection_status="Degraded",
                latency_ms=random.randint(1800, 4200),
                error_message="CommServ API responded with HTTP 504 on last 2 of 5 polling attempts",
            )
        return ConnectorHealth(connection_status="Healthy", latency_ms=random.randint(90, 260))

    def fetch_assets(self, count: int = 120):
        assets = []
        for i in range(1, count + 1):
            native_type = random.choice(["File Server", "Exchange Mailbox DB", "Active Directory", "SAP HANA"])
            assets.append(make_asset("CORP-FS" if native_type == "File Server" else "CORP-APP", i,
                                      native_type, "FS" if native_type == "File Server" else "APP",
                                      SLA_NAMES, REPLICATION_TARGETS))
        return assets

    def fetch_jobs(self, assets=None, lookback_hours: int = 72):
        assets = assets or self.fetch_assets()
        jobs = []
        for a in assets:
            jobs += make_job_history(a, NATIVE_STATUSES, FAILURE_REASONS, lookback_hours)
        return jobs
