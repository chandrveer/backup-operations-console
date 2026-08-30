from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from .. import models
from ._serializers import serialize_alert

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
def list_alerts(
    alert_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    platform: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Alert).options(joinedload(models.Alert.asset), joinedload(models.Alert.platform))
    if alert_type:
        q = q.filter(models.Alert.alert_type == alert_type)
    if severity:
        q = q.filter(models.Alert.severity == severity)
    if status:
        q = q.filter(models.Alert.status == status)
    if platform:
        q = q.join(models.Platform).filter(models.Platform.vendor_key == platform)
    q = q.order_by(models.Alert.created_at.desc())
    return [serialize_alert(a) for a in q.all()]


@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(models.Alert).get(alert_id)
    if not alert:
        return {"error": "not found"}
    alert.status = models.AlertStatus.ACKNOWLEDGED
    alert.acknowledged_at = datetime.utcnow()
    db.commit()
    return serialize_alert(alert)


@router.post("/{alert_id}/resolve")
def resolve_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(models.Alert).get(alert_id)
    if not alert:
        return {"error": "not found"}
    alert.status = models.AlertStatus.RESOLVED
    alert.resolved_at = datetime.utcnow()
    db.commit()
    return serialize_alert(alert)


@router.get("/summary/by-type")
def alerts_by_type(db: Session = Depends(get_db)):
    from sqlalchemy import func
    rows = (
        db.query(models.Alert.alert_type, func.count(models.Alert.id))
        .filter(models.Alert.status == models.AlertStatus.OPEN)
        .group_by(models.Alert.alert_type)
        .all()
    )
    return [{"alert_type": t.value if hasattr(t, "value") else t, "count": c} for t, c in rows]
