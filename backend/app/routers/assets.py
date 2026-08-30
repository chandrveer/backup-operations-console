from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from .. import models
from ._serializers import serialize_asset, serialize_job, serialize_alert

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.get("")
def list_assets(
    q: Optional[str] = None,
    platform: Optional[str] = None,
    application: Optional[str] = None,
    asset_type: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(models.Asset).options(
        joinedload(models.Asset.application), joinedload(models.Asset.platform)
    )
    # Join each related table at most once, regardless of how many filters touch it.
    if q or application:
        query = query.join(models.Application, models.Asset.application_id == models.Application.id, isouter=True)
    if platform:
        query = query.join(models.Platform, models.Asset.platform_id == models.Platform.id)

    if q:
        like = f"%{q}%"
        query = query.filter(
            (models.Asset.name.ilike(like)) | (models.Application.name.ilike(like)) | (models.Asset.owner.ilike(like))
        )
    if platform:
        query = query.filter(models.Platform.vendor_key == platform)
    if application:
        query = query.filter(models.Application.name == application)
    if asset_type:
        query = query.filter(models.Asset.asset_type == asset_type)
    if status:
        query = query.filter(models.Asset.last_backup_status == status)

    total = query.count()
    query = query.order_by(models.Asset.name).offset((page - 1) * page_size).limit(page_size)
    assets = query.all()
    return {"total": total, "page": page, "page_size": page_size, "items": [serialize_asset(a) for a in assets]}


@router.get("/{asset_id}")
def get_asset_lineage(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(models.Asset).options(
        joinedload(models.Asset.application), joinedload(models.Asset.platform)
    ).get(asset_id)
    if not asset:
        return {"error": "not found"}

    recent_jobs = (
        db.query(models.Job)
        .options(joinedload(models.Job.asset).joinedload(models.Asset.application), joinedload(models.Job.platform))
        .filter(models.Job.asset_id == asset_id)
        .order_by(models.Job.start_time.desc())
        .limit(15)
        .all()
    )
    open_alerts = (
        db.query(models.Alert)
        .options(joinedload(models.Alert.asset), joinedload(models.Alert.platform))
        .filter(models.Alert.asset_id == asset_id, models.Alert.status == models.AlertStatus.OPEN)
        .all()
    )
    return {
        "asset": serialize_asset(asset),
        "recent_jobs": [serialize_job(j) for j in recent_jobs],
        "open_alerts": [serialize_alert(a) for a in open_alerts],
    }
