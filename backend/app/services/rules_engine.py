"""
Monitoring & Rules Engine.

Evaluates the normalized data already sitting in the central DB and raises
alerts. Deliberately keeps six *distinct* alert types apart, most
importantly:

  - "Backup Failure"        -> a job actually ran and failed.
  - "Connector/API Failure" -> the platform we monitor through is
                                unreachable/degraded, so we may not even
                                know the true backup status right now.

Conflating those two is the #1 complaint about naive backup dashboards.
"""
import re
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from .. import models

REPO_KEYWORDS = re.compile(r"(space|storage|library|repository|quota|firewall blocked)", re.I)

SEVERITY_BY_TYPE = {
    models.AlertType.CONNECTOR_FAILURE: models.AlertSeverity.HIGH,
    models.AlertType.MISSING_BACKUP: models.AlertSeverity.HIGH,
}


def _upsert_alert(db: Session, alert_type, severity, title, description,
                   asset_id=None, job_id=None, platform_id=None):
    """Avoid duplicate open alerts for the same asset+type."""
    existing = (
        db.query(models.Alert)
        .filter_by(alert_type=alert_type, asset_id=asset_id, platform_id=platform_id, status=models.AlertStatus.OPEN)
        .first()
    )
    if existing:
        existing.title = title
        existing.description = description
        existing.job_id = job_id or existing.job_id
        return existing

    alert = models.Alert(
        alert_type=alert_type, severity=severity, title=title, description=description,
        asset_id=asset_id, job_id=job_id, platform_id=platform_id,
    )
    db.add(alert)
    return alert


def evaluate_connector_health(db: Session):
    platforms = db.query(models.Platform).all()
    for p in platforms:
        if p.connection_status in ("Degraded", "Down"):
            sev = models.AlertSeverity.CRITICAL if p.connection_status == "Down" else models.AlertSeverity.HIGH
            _upsert_alert(
                db, models.AlertType.CONNECTOR_FAILURE, sev,
                f"{p.name} connector is {p.connection_status.lower()}",
                p.error_message or f"Monitoring connector for {p.name} is not returning reliable data. "
                                    f"Backup status for assets on this platform may be stale or unknown.",
                platform_id=p.id,
            )
        else:
            # auto-resolve a previously open connector alert for this platform
            open_alert = (
                db.query(models.Alert)
                .filter_by(alert_type=models.AlertType.CONNECTOR_FAILURE, platform_id=p.id,
                           status=models.AlertStatus.OPEN)
                .first()
            )
            if open_alert:
                open_alert.status = models.AlertStatus.RESOLVED
                open_alert.resolved_at = datetime.utcnow()
    db.commit()


def evaluate_job_failures(db: Session, lookback_hours: int = 24):
    since = datetime.utcnow() - timedelta(hours=lookback_hours)
    failed_jobs = (
        db.query(models.Job)
        .filter(models.Job.status == models.JobStatus.FAILED, models.Job.start_time >= since)
        .all()
    )
    for job in failed_jobs:
        reason = job.failure_reason or "Unknown failure"
        is_repo_issue = bool(REPO_KEYWORDS.search(reason))
        alert_type = models.AlertType.REPOSITORY_ISSUE if is_repo_issue else models.AlertType.BACKUP_FAILURE
        asset_name = job.asset.name if job.asset else "Unknown asset"
        _upsert_alert(
            db, alert_type,
            models.AlertSeverity.CRITICAL if not is_repo_issue else models.AlertSeverity.HIGH,
            f"Backup failed: {asset_name}" if not is_repo_issue else f"Repository issue affecting {asset_name}",
            reason,
            asset_id=job.asset_id, job_id=job.id, platform_id=job.platform_id,
        )
    db.commit()


def evaluate_sla_rpo_breaches(db: Session):
    assets = db.query(models.Asset).all()
    now = datetime.utcnow()
    for asset in assets:
        rpo_hours = asset.rpo_hours or 24
        deadline = now - timedelta(hours=rpo_hours)

        if asset.last_successful_backup_at is None:
            _upsert_alert(
                db, models.AlertType.MISSING_BACKUP, models.AlertSeverity.HIGH,
                f"No successful backup on record: {asset.name}",
                f"{asset.name} ({asset.sla_name or 'no SLA'}) has no successful backup in the sync window.",
                asset_id=asset.id, platform_id=asset.platform_id,
            )
            continue

        if asset.last_successful_backup_at < deadline:
            hours_overdue = round((now - asset.last_successful_backup_at).total_seconds() / 3600, 1)
            _upsert_alert(
                db, models.AlertType.RPO_VIOLATION, models.AlertSeverity.CRITICAL,
                f"RPO breached: {asset.name}",
                f"Last successful backup was {hours_overdue}h ago, exceeding the {rpo_hours:.0f}h RPO "
                f"for policy '{asset.policy_name}'.",
                asset_id=asset.id, platform_id=asset.platform_id,
            )
            # An RPO breach beyond 2x the window is also treated as an SLA violation.
            if asset.last_successful_backup_at < now - timedelta(hours=rpo_hours * 2):
                _upsert_alert(
                    db, models.AlertType.SLA_VIOLATION, models.AlertSeverity.CRITICAL,
                    f"SLA breached: {asset.name}",
                    f"{asset.name} has missed its '{asset.sla_name}' SLA — no successful backup for "
                    f"{hours_overdue}h (SLA target {rpo_hours:.0f}h).",
                    asset_id=asset.id, platform_id=asset.platform_id,
                )
        else:
            # auto-resolve
            for atype in (models.AlertType.RPO_VIOLATION, models.AlertType.SLA_VIOLATION, models.AlertType.MISSING_BACKUP):
                open_alert = (
                    db.query(models.Alert)
                    .filter_by(alert_type=atype, asset_id=asset.id, status=models.AlertStatus.OPEN)
                    .first()
                )
                if open_alert:
                    open_alert.status = models.AlertStatus.RESOLVED
                    open_alert.resolved_at = now
    db.commit()


def run_all_rules(db: Session):
    evaluate_connector_health(db)
    evaluate_job_failures(db)
    evaluate_sla_rpo_breaches(db)
