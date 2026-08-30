from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..services import dashboard_service

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary(db: Session = Depends(get_db)):
    return dashboard_service.get_summary(db)


@router.get("/platform-health")
def platform_health(db: Session = Depends(get_db)):
    return dashboard_service.get_platform_health(db)


@router.get("/trend")
def trend(days: int = Query(7, ge=1, le=30), db: Session = Depends(get_db)):
    return dashboard_service.get_backup_trend(db, days)
