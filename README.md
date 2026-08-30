# Mission Control — Centralized Backup Operations Console

A single-pane-of-glass console for monitoring Rubrik, Veeam, Commvault, and
Microsoft Azure Backup: unified dashboard, job monitoring, asset lineage
search, and a centralized alert system that keeps "a backup failed" cleanly
separate from "we lost visibility into a backup platform."

## Architecture

```
Rubrik / Veeam / Commvault / Azure Backup APIs
              ↓
   Connector Layer        backend/app/connectors/
   (mock today, real-API-shaped — one class per vendor, one registry)
              ↓
   Data Normalization      backend/app/normalization/
   (vendor status/type vocab -> canonical enums)
              ↓
   Central Database        PostgreSQL via SQLAlchemy (backend/app/models.py)
              ↓
   Monitoring & Rules Engine   backend/app/services/rules_engine.py
   (SLA/RPO breach detection, connector-health alerts, auto-resolve)
              ↓
   Dashboard / Inventory / Alerts / Reports   FastAPI + React/TS frontend
```

## Stack

- **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL (SQLite fallback for
  zero-config local dev), APScheduler for periodic re-sync.
- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Recharts, React
  Router.
- **Infra:** Docker Compose (db + backend + frontend).

## Running it

### Option A — Docker Compose (recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000 (docs at `/docs`)
- Postgres: localhost:5432

On first boot the backend seeds the database by pulling from every mock
connector (~550 assets, thousands of job records) and running the rules
engine once. After that it re-syncs and re-evaluates every 10 minutes,
simulating periodic platform polling.

### Option B — Run locally without Docker

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Defaults to a local SQLite file (`backup_console.db`) — no Postgres needed.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Vite proxies `/api` to `http://localhost:8000` by default (see
`vite.config.ts` / `VITE_API_PROXY`).

## Going from mock to real backup platforms

Nothing outside `backend/app/connectors/` needs to change. Each connector
implements `BaseConnector` (`connectors/base.py`):

```python
class YourConnector(BaseConnector):
    vendor_key = "your_platform"
    def health_check(self) -> ConnectorHealth: ...
    def fetch_assets(self) -> List[RawAsset]: ...
    def fetch_jobs(self, lookback_hours=72) -> List[RawJob]: ...
```

Swap the mock body for real API calls (see the docstring at the top of each
`rubrik.py` / `veeam.py` / `commvault.py` / `azure_backup.py` for the
specific endpoints to target), register credentials, and the sync service,
normalization layer, rules engine, and every page in the UI keep working
unmodified. Adding a fifth platform (Cohesity, HYCU, etc.) is the same
pattern — implement the interface, add one line to
`connectors/registry.py`.

## Key design decisions

- **Backup Failure vs. Connector/API Failure are distinct alert types.**
  A failed job means a backup actually ran and failed. A connector/API
  failure means the monitoring layer lost reliable visibility into a
  platform — potentially masking real backup status. The rules engine
  (`services/rules_engine.py`) and the Alerts UI keep these visually and
  semantically separate so on-call staff never conflate "definitely broken"
  with "we don't currently know."
- **Normalization is centralized.** Every vendor's own status/type
  vocabulary (Rubrik's "Success"/"Failure", Commvault's "Completed"/
  "Completed w/ errors", Azure's "CompletedWithWarnings"...) is mapped once
  in `normalization/normalizer.py` into a canonical `JobStatus` enum, so
  the dashboard, filters, and reports never special-case a vendor.
- **Modular connector registry.** `connectors/registry.py` is the single
  place new platforms get wired in.
