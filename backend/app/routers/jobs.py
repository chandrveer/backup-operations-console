from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from .. import models
from ._serializers import serialize_job

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("")
def list_jobs(
    platform: Optional[str] = None,
    status: Optional[str] = None,
    application: Optional[str] = None,
    server: Optional[str] = None,
    sla: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
):
    q = (
        db.query(models.Job)
        .options(joinedload(models.Job.asset).joinedload(models.Asset.application), joinedload(models.Job.platform))
    )
    if platform:
        q = q.join(models.Platform, models.Job.platform_id == models.Platform.id).filter(
            models.Platform.vendor_key == platform
        )
    if status:
        q = q.filter(models.Job.status == status)
    if application or server:
        q = q.join(models.Asset, models.Job.asset_id == models.Asset.id, isouter=True)
    if application:
        q = q.join(models.Application, models.Asset.application_id == models.Application.id).filter(
            models.Application.name == application
        )
    if server:
        q = q.filter(models.Asset.name.ilike(f"%{server}%"))
    if sla:
        q = q.filter(models.Job.policy_name.ilike(f"%{sla}%"))
    if date_from:
        q = q.filter(models.Job.start_time >= date_from)
    if date_to:
        q = q.filter(models.Job.start_time <= date_to)

    total = q.count()
    q = q.order_by(models.Job.start_time.desc()).offset((page - 1) * page_size).limit(page_size)
    jobs = q.all()
    return {"total": total, "page": page, "page_size": page_size, "items": [serialize_job(j) for j in jobs]}


@router.get("/{job_id}")
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(models.Job).options(
        joinedload(models.Job.asset).joinedload(models.Asset.application), joinedload(models.Job.platform)
    ).get(job_id)
    if not job:
        return {"error": "not found"}
    return serialize_job(job)
