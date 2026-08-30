from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..connectors.registry import CONNECTOR_REGISTRY
from ..schemas import PlatformOut

router = APIRouter(prefix="/api/platforms", tags=["platforms"])


@router.get("", response_model=list[PlatformOut])
def list_platforms(db: Session = Depends(get_db)):
    return db.query(models.Platform).all()


@router.get("/catalog")
def connector_catalog():
    """All connector types the system knows about, whether configured or not —
    powers the Integrations page 'available connectors' list."""
    return [
        {"vendor_key": k, "display_name": v["display_name"]}
        for k, v in CONNECTOR_REGISTRY.items()
    ]
