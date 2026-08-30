"""
Microsoft Azure Backup connector.

Real implementation notes (for later):
  - Auth: Azure AD app registration, client-credentials OAuth2 against
    management.azure.com.
  - Assets: Recovery Services Vault `backupProtectedItems` list API.
  - Jobs: Recovery Services Vault `backupJobs` list API.
  - Health: ARM token acquisition + vault `GET` reachability.
"""
import random

from .base import BaseConnector, ConnectorHealth
from .mock_utils import make_asset, make_job_history

NATIVE_STATUSES = {"Completed": 80, "Failed": 7, "InProgress": 6, "CompletedWithWarnings": 5, "Cancelled": 2}
FAILURE_REASONS = [
    "Extension health state is unhealthy on the VM",
    "Snapshot operation failed — ARM throttling (429)",
    "Recovery Services vault soft-delete quota exceeded",
    "Guest agent not responding for app-consistent snapshot",
    "Storage account firewall blocked backup traffic",
]
SLA_NAMES = ["Azure-Standard", "Azure-Enhanced", "Azure-SQL-Hourly"]
REPLICATION_TARGETS = ["Azure Paired Region (GRS)", "Azure Backup Vault - Secondary Region"]


class AzureBackupConnector(BaseConnector):
    vendor_key = "azure_backup"
    display_name = "Microsoft Azure Backup"

    def health_check(self) -> ConnectorHealth:
        return ConnectorHealth(connection_status="Healthy", latency_ms=random.randint(100, 260))

    def fetch_assets(self, count: int = 130):
        assets = []
        for i in range(1, count + 1):
            native_type = random.choice(["Azure VM", "Azure SQL Database", "Azure Files Share", "Azure Blob"])
            prefix = "AZR-SQL" if "SQL" in native_type else "AZR-VM"
            assets.append(make_asset(prefix, i, native_type, "AZR", SLA_NAMES, REPLICATION_TARGETS))
        return assets

    def fetch_jobs(self, assets=None, lookback_hours: int = 72):
        assets = assets or self.fetch_assets()
        jobs = []
        for a in assets:
            jobs += make_job_history(a, NATIVE_STATUSES, FAILURE_REASONS, lookback_hours)
        return jobs
