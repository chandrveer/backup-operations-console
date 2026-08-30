from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.search_service import global_search
from ._serializers import serialize_asset

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("")
def search(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    assets = global_search(db, q)
    return {"query": q, "results": [serialize_asset(a) for a in assets]}
