import logging
from .database import SessionLocal, engine, Base
from .connectors.registry import CONNECTOR_REGISTRY
from .services.sync_service import sync_all
from .services.rules_engine import run_all_rules
from . import models  # noqa: F401 ensures models are registered on Base

logger = logging.getLogger("seed")


def init_db_and_seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(models.Platform).count()
        if existing == 0:
            logger.info("Empty database detected — running initial connector sync for all platforms")
            sync_all(db)
            run_all_rules(db)
        else:
            logger.info("Database already seeded, skipping initial sync")
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_db_and_seed()
