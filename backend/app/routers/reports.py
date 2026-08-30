from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from .. import models
from ..services import dashboard_service

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/compliance-by-application")
def compliance_by_application(db: Session = Depends(get_db)):
    apps = db.query(models.Application).all()
    out = []
    for app in apps:
        assets = db.query(models.Asset).filter(models.Asset.application_id == app.id).all()
        if not assets:
            continue
        compliant = sum(1 for a in assets if a.last_backup_status == models.JobStatus.SUCCESS)
        out.append({
            "application": app.name,
            "total_assets": len(assets),
            "compliant_assets": compliant,
            "compliance_pct": round((compliant / len(assets)) * 100, 1) if assets else 0,
        })
    return sorted(out, key=lambda x: x["compliance_pct"])


@router.get("/platform-summary")
def platform_summary(db: Session = Depends(get_db)):
    return dashboard_service.get_platform_health(db)


@router.get("/failure-reasons")
def top_failure_reasons(db: Session = Depends(get_db)):
    rows = (
        db.query(models.Job.failure_reason, func.count(models.Job.id))
        .filter(models.Job.status == models.JobStatus.FAILED, models.Job.failure_reason.isnot(None))
        .group_by(models.Job.failure_reason)
        .order_by(func.count(models.Job.id).desc())
        .limit(10)
        .all()
    )
    return [{"reason": r, "count": c} for r, c in rows]
