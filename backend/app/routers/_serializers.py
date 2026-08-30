from .. import models


def serialize_asset(a: models.Asset) -> dict:
    return {
        "id": a.id, "name": a.name,
        "asset_type": a.asset_type.value if hasattr(a.asset_type, "value") else a.asset_type,
        "environment": a.environment,
        "application_name": a.application.name if a.application else None,
        "platform_name": a.platform.name if a.platform else None,
        "policy_name": a.policy_name, "sla_name": a.sla_name,
        "rpo_hours": a.rpo_hours, "rto_hours": a.rto_hours, "retention_days": a.retention_days,
        "replication_enabled": a.replication_enabled, "replication_target": a.replication_target,
        "last_successful_backup_at": a.last_successful_backup_at,
        "last_backup_status": a.last_backup_status.value if hasattr(a.last_backup_status, "value") else a.last_backup_status,
        "owner": a.owner, "tags": a.tags,
    }


def serialize_job(j: models.Job) -> dict:
    return {
        "id": j.id, "job_name": j.job_name, "asset_id": j.asset_id,
        "asset_name": j.asset.name if j.asset else None,
        "application_name": j.asset.application.name if j.asset and j.asset.application else None,
        "platform_name": j.platform.name if j.platform else None,
        "policy_name": j.policy_name, "start_time": j.start_time, "end_time": j.end_time,
        "status": j.status.value if hasattr(j.status, "value") else j.status,
        "failure_reason": j.failure_reason, "rpo_hours": j.rpo_hours, "owner": j.owner,
        "duration_seconds": j.duration_seconds, "bytes_transferred_gb": j.bytes_transferred_gb,
        "last_successful_backup_at": j.asset.last_successful_backup_at if j.asset else None,
    }


def serialize_alert(al: models.Alert) -> dict:
    return {
        "id": al.id,
        "alert_type": al.alert_type.value if hasattr(al.alert_type, "value") else al.alert_type,
        "severity": al.severity.value if hasattr(al.severity, "value") else al.severity,
        "status": al.status.value if hasattr(al.status, "value") else al.status,
        "title": al.title, "description": al.description,
        "asset_name": al.asset.name if al.asset else None,
        "platform_name": al.platform.name if al.platform else None,
        "created_at": al.created_at, "acknowledged_at": al.acknowledged_at, "resolved_at": al.resolved_at,
    }
