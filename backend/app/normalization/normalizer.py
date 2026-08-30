"""
Data Normalization layer.

Every connector speaks its vendor's own vocabulary (Rubrik says "Success" /
"Failure", Commvault says "Completed" / "Failed", Azure says "Completed" /
"CompletedWithWarnings"...). This module is the single place that maps all
of that into the canonical enums used everywhere downstream: models.JobStatus
and models.AssetType. Add a platform's status/type vocabulary here once and
every dashboard, alert, and report automatically understands it.
"""
from ..models import JobStatus, AssetType

STATUS_MAP = {
    # Rubrik
    "success": JobStatus.SUCCESS, "failure": JobStatus.FAILED, "running": JobStatus.RUNNING,
    "canceled": JobStatus.SKIPPED, "queued": JobStatus.RUNNING,
    # Veeam
    "failed": JobStatus.FAILED, "warning": JobStatus.WARNING, "none": JobStatus.SKIPPED,
    # Commvault
    "completed": JobStatus.SUCCESS, "completed w/ errors": JobStatus.WARNING, "killed": JobStatus.SKIPPED,
    # Azure
    "inprogress": JobStatus.RUNNING, "completedwithwarnings": JobStatus.WARNING, "cancelled": JobStatus.SKIPPED,
}

TYPE_MAP = {
    "vmware vm": AssetType.VM, "hyper-v vm": AssetType.VM, "azure vm": AssetType.CLOUD_INSTANCE,
    "mssql database": AssetType.DATABASE, "oracle database": AssetType.DATABASE,
    "azure sql database": AssetType.DATABASE, "sap hana": AssetType.DATABASE,
    "nas share": AssetType.FILE_SHARE, "azure files share": AssetType.FILE_SHARE,
    "file server": AssetType.FILE_SHARE, "physical server": AssetType.PHYSICAL_SERVER,
    "exchange mailbox db": AssetType.APPLICATION, "active directory": AssetType.APPLICATION,
    "azure blob": AssetType.FILE_SHARE,
}


def normalize_status(native_status: str) -> JobStatus:
    return STATUS_MAP.get(native_status.strip().lower(), JobStatus.WARNING)


def normalize_asset_type(native_type: str) -> AssetType:
    return TYPE_MAP.get(native_type.strip().lower(), AssetType.APPLICATION)
