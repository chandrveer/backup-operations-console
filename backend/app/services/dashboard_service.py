from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import models


def get_summary(db: Session) -> dict:
    since = datetime.utcnow() - timedelta(hours=24)
    total_assets = db.query(func.count(models.Asset.id)).scalar() or 0

    def count_status(status):
        return (
            db.query(func.count(models.Job.id))
            .filter(models.Job.status == status, models.Job.start_time >= since)
            .scalar() or 0
        )

    successful = count_status(models.JobStatus.SUCCESS)
    failed = count_status(models.JobStatus.FAILED)
    running = db.query(func.count(models.Job.id)).filter(models.Job.status == models.JobStatus.RUNNING).scalar() or 0
    skipped = count_status(models.JobStatus.SKIPPED)

    sla_breaches = db.query(func.count(models.Alert.id)).filter(
        models.Alert.alert_type == models.AlertType.SLA_VIOLATION,
        models.Alert.status == models.AlertStatus.OPEN,
    ).scalar() or 0

    rpo_breaches = db.query(func.count(models.Alert.id)).filter(
        models.Alert.alert_type == models.AlertType.RPO_VIOLATION,
        models.Alert.status == models.AlertStatus.OPEN,
    ).scalar() or 0

    missing = db.query(func.count(models.Alert.id)).filter(
        models.Alert.alert_type == models.AlertType.MISSING_BACKUP,
        models.Alert.status == models.AlertStatus.OPEN,
    ).scalar() or 0

    open_alerts = db.query(func.count(models.Alert.id)).filter(models.Alert.status == models.AlertStatus.OPEN).scalar() or 0
    critical_alerts = db.query(func.count(models.Alert.id)).filter(
        models.Alert.status == models.AlertStatus.OPEN, models.Alert.severity == models.AlertSeverity.CRITICAL
    ).scalar() or 0

    return {
        "total_assets": total_assets,
        "successful_backups_24h": successful,
        "failed_backups_24h": failed,
        "running_backups": running,
        "skipped_backups_24h": skipped,
        "sla_breaches": sla_breaches,
        "rpo_breaches": rpo_breaches,
        "assets_without_recent_backup": missing,
        "open_alerts": open_alerts,
        "critical_alerts": critical_alerts,
    }


def get_platform_health(db: Session):
    platforms = db.query(models.Platform).all()
    since = datetime.utcnow() - timedelta(hours=24)
    results = []
    for p in platforms:
        total_assets = db.query(func.count(models.Asset.id)).filter(models.Asset.platform_id == p.id).scalar() or 0
        total_jobs_24h = db.query(func.count(models.Job.id)).filter(
            models.Job.platform_id == p.id, models.Job.start_time >= since
        ).scalar() or 0
        success_jobs = db.query(func.count(models.Job.id)).filter(
            models.Job.platform_id == p.id, models.Job.start_time >= since, models.Job.status == models.JobStatus.SUCCESS
        ).scalar() or 0
        failed_jobs = db.query(func.count(models.Job.id)).filter(
            models.Job.platform_id == p.id, models.Job.start_time >= since, models.Job.status == models.JobStatus.FAILED
        ).scalar() or 0
        sla_breaches = db.query(func.count(models.Alert.id)).filter(
            models.Alert.platform_id == p.id, models.Alert.alert_type == models.AlertType.SLA_VIOLATION,
            models.Alert.status == models.AlertStatus.OPEN
        ).scalar() or 0

        success_rate = round((success_jobs / total_jobs_24h) * 100, 1) if total_jobs_24h else 100.0

        results.append({
            "platform_id": p.id, "platform_name": p.name, "vendor_key": p.vendor_key,
            "connection_status": p.connection_status.value if hasattr(p.connection_status, "value") else p.connection_status,
            "total_assets": total_assets, "success_rate_pct": success_rate,
            "failed_jobs_24h": failed_jobs, "sla_breaches": sla_breaches,
            "last_sync_at": p.last_sync_at, "api_latency_ms": p.api_latency_ms,
        })
    return results


def get_backup_trend(db: Session, days: int = 7):
    points = []
    for i in range(days - 1, -1, -1):
        day_start = (datetime.utcnow() - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        def count(status):
            return db.query(func.count(models.Job.id)).filter(
                models.Job.start_time >= day_start, models.Job.start_time < day_end, models.Job.status == status
            ).scalar() or 0

        points.append({
            "date": day_start.strftime("%b %d"),
            "success": count(models.JobStatus.SUCCESS),
            "failed": count(models.JobStatus.FAILED),
            "skipped": count(models.JobStatus.SKIPPED),
        })
    return points
