from sqlalchemy.orm import Session
from sqlalchemy import or_

from .. import models


def global_search(db: Session, q: str, limit: int = 20):
    like = f"%{q}%"
    assets = (
        db.query(models.Asset)
        .join(models.Application, isouter=True)
        .filter(or_(models.Asset.name.ilike(like), models.Application.name.ilike(like), models.Asset.owner.ilike(like)))
        .limit(limit)
        .all()
    )
    return assets
