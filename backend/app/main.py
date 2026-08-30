import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from .seed import init_db_and_seed
from .database import SessionLocal
from .services.sync_service import sync_all
from .services.rules_engine import run_all_rules
from .routers import dashboard, jobs, assets, applications, platforms, sla, alerts, reports, integrations, search

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

scheduler = BackgroundScheduler()


def scheduled_sync():
    db = SessionLocal()
    try:
        sync_all(db)
        run_all_rules(db)
        logger.info("Scheduled sync + rules evaluation complete")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db_and_seed()
    # Simulate periodic polling of every backup platform, like a real
    # monitoring connector would do every few minutes.
    scheduler.add_job(scheduled_sync, "interval", minutes=10, id="sync_all")
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title="Backup Operations Console API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(jobs.router)
app.include_router(assets.router)
app.include_router(applications.router)
app.include_router(platforms.router)
app.include_router(sla.router)
app.include_router(alerts.router)
app.include_router(reports.router)
app.include_router(integrations.router)
app.include_router(search.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
