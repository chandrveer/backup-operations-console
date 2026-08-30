from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/sla", tags=["sla"])


@router.get("/policies")
def list_policies(db: Session = Depends(get_db)):
    rows = (
        db.query(
            models.Asset.sla_name,
            func.count(models.Asset.id).label("asset_count"),
            func.avg(models.Asset.rpo_hours).label("avg_rpo"),
            func.avg(models.Asset.rto_hours).label("avg_rto"),
        )
        .group_by(models.Asset.sla_name)
        .all()
    )
    out = []
    for r in rows:
        breaches = (
            db.query(func.count(models.Alert.id))
            .join(models.Asset, models.Alert.asset_id == models.Asset.id)
            .filter(
                models.Asset.sla_name == r.sla_name,
                models.Alert.alert_type.in_([models.AlertType.SLA_VIOLATION, models.AlertType.RPO_VIOLATION]),
                models.Alert.status == models.AlertStatus.OPEN,
            )
            .scalar() or 0
        )
        out.append({
            "sla_name": r.sla_name, "asset_count": r.asset_count,
            "avg_rpo_hours": round(r.avg_rpo, 1) if r.avg_rpo else 0,
            "avg_rto_hours": round(r.avg_rto, 1) if r.avg_rto else 0,
            "open_breaches": breaches,
        })
    return sorted(out, key=lambda x: -x["open_breaches"])
