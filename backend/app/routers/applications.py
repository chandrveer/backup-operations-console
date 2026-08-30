from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/applications", tags=["applications"])


@router.get("")
def list_applications(db: Session = Depends(get_db)):
    apps = db.query(models.Application).all()
    out = []
    for app in apps:
        total_assets = db.query(func.count(models.Asset.id)).filter(models.Asset.application_id == app.id).scalar() or 0
        failed = db.query(func.count(models.Asset.id)).filter(
            models.Asset.application_id == app.id, models.Asset.last_backup_status == models.JobStatus.FAILED
        ).scalar() or 0
        open_alerts = (
            db.query(func.count(models.Alert.id))
            .join(models.Asset, models.Alert.asset_id == models.Asset.id)
            .filter(models.Asset.application_id == app.id, models.Alert.status == models.AlertStatus.OPEN)
            .scalar() or 0
        )
        out.append({
            "id": app.id, "name": app.name, "owner": app.owner, "criticality": app.criticality,
            "total_assets": total_assets, "assets_with_failures": failed, "open_alerts": open_alerts,
        })
    return out
