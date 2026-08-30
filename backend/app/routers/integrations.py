from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..connectors.registry import CONNECTOR_REGISTRY
from ..services.sync_service import sync_platform
from ..services.rules_engine import run_all_rules

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


@router.get("/status")
def integrations_status(db: Session = Depends(get_db)):
    platforms = {p.vendor_key: p for p in db.query(models.Platform).all()}
    out = []
    for key, entry in CONNECTOR_REGISTRY.items():
        p = platforms.get(key)
        out.append({
            "vendor_key": key,
            "display_name": entry["display_name"],
            "configured": p is not None,
            "connection_status": (p.connection_status.value if p and hasattr(p.connection_status, "value") else (p.connection_status if p else "Not Configured")),
            "last_sync_at": p.last_sync_at if p else None,
            "api_latency_ms": p.api_latency_ms if p else None,
            "error_message": p.error_message if p else None,
            "is_mock": p.is_mock if p else True,
        })
    return out


@router.post("/{vendor_key}/sync")
def trigger_sync(vendor_key: str, db: Session = Depends(get_db)):
    if vendor_key not in CONNECTOR_REGISTRY:
        return {"error": "unknown connector"}
    sync_platform(db, vendor_key)
    run_all_rules(db)
    return {"status": "synced", "vendor_key": vendor_key}
