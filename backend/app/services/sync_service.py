"""
Sync Service — the glue between Connector Layer -> Normalization -> Central DB.

Pulls assets + jobs from every registered connector, normalizes vendor
vocab into canonical enums, and upserts into PostgreSQL/SQLite. Also
records each platform's connection health so Integrations/Alerts can
distinguish "the connector API is down" from "a backup job failed".
"""
import logging
from datetime import datetime

from sqlalchemy.orm import Session

from ..connectors.registry import CONNECTOR_REGISTRY, get_connector_instance
from ..normalization.normalizer import normalize_status, normalize_asset_type
from .. import models

logger = logging.getLogger("sync_service")


def _get_or_create_platform(db: Session, vendor_key: str, display_name: str) -> models.Platform:
    platform = db.query(models.Platform).filter_by(vendor_key=vendor_key).first()
    if not platform:
        platform = models.Platform(name=display_name, vendor_key=vendor_key, is_mock=True)
        db.add(platform)
        db.commit()
        db.refresh(platform)
    return platform


def _get_or_create_application(db: Session, name: str, owner: str) -> models.Application:
    app = db.query(models.Application).filter_by(name=name).first()
    if not app:
        app = models.Application(name=name, owner=owner, criticality="Medium")
        db.add(app)
        db.commit()
        db.refresh(app)
    return app


def sync_platform(db: Session, vendor_key: str):
    entry = CONNECTOR_REGISTRY[vendor_key]
    connector = get_connector_instance(vendor_key)
    platform = _get_or_create_platform(db, vendor_key, entry["display_name"])

    start = datetime.utcnow()
    health = connector.health_check()
    platform.connection_status = health.connection_status
    platform.api_latency_ms = health.latency_ms
    platform.error_message = health.error_message
    platform.last_sync_at = datetime.utcnow()

    if health.connection_status == "Down":
        # Do not attempt to pull assets/jobs from a connector that's down —
        # this is exactly the scenario the "Connector/API Failure" alert covers.
        db.commit()
        logger.warning(f"[{vendor_key}] connector down, skipping data pull")
        return

    raw_assets = connector.fetch_assets()
    asset_by_external_id = {}

    for ra in raw_assets:
        application = _get_or_create_application(db, ra.application, ra.owner)
        asset = (
            db.query(models.Asset)
            .filter_by(external_id=ra.external_id, platform_id=platform.id)
            .first()
        )
        if not asset:
            asset = models.Asset(external_id=ra.external_id, platform_id=platform.id)
            db.add(asset)

        asset.name = ra.name
        asset.asset_type = normalize_asset_type(ra.native_type)
        asset.environment = ra.environment
        asset.application_id = application.id
        asset.policy_name = ra.policy_name
        asset.sla_name = ra.sla_name
        asset.rpo_hours = ra.rpo_hours
        asset.rto_hours = ra.rto_hours
        asset.retention_days = ra.retention_days
        asset.replication_enabled = ra.replication_enabled
        asset.replication_target = ra.replication_target
        asset.owner = ra.owner
        asset.tags = ",".join(ra.tags)
        db.flush()
        asset_by_external_id[ra.external_id] = asset

    db.commit()

    raw_jobs = connector.fetch_jobs(assets=raw_assets)
    for rj in raw_jobs:
        asset = asset_by_external_id.get(rj.external_asset_id)
        if not asset:
            continue
        status = normalize_status(rj.native_status)

        job = models.Job(
            job_name=rj.job_name,
            asset_id=asset.id,
            platform_id=platform.id,
            policy_name=rj.policy_name,
            start_time=rj.start_time,
            end_time=rj.end_time,
            status=status,
            failure_reason=rj.failure_reason,
            rpo_hours=rj.rpo_hours,
            owner=rj.owner,
            bytes_transferred_gb=rj.bytes_transferred_gb,
            duration_seconds=rj.duration_seconds,
        )
        db.add(job)

        if status == models.JobStatus.SUCCESS and rj.end_time:
            if not asset.last_successful_backup_at or rj.end_time > asset.last_successful_backup_at:
                asset.last_successful_backup_at = rj.end_time
        if not asset.last_backup_status or (rj.end_time and (
                not asset.last_successful_backup_at or rj.start_time >= (asset.last_successful_backup_at or datetime.min))):
            asset.last_backup_status = status

    db.commit()
    platform.last_sync_duration_ms = int((datetime.utcnow() - start).total_seconds() * 1000)
    db.commit()
    logger.info(f"[{vendor_key}] synced {len(raw_assets)} assets / {len(raw_jobs)} jobs")


def sync_all(db: Session):
    for vendor_key in CONNECTOR_REGISTRY:
        try:
            sync_platform(db, vendor_key)
        except Exception as e:
            logger.exception(f"Sync failed for {vendor_key}: {e}")
