"""
Shared helpers for building realistic, deterministic mock inventories/jobs
per vendor. Each connector calls these with its own naming conventions and
native status vocabulary so the mock fleet feels like four distinct real
platforms rather than one dataset reskinned four times.
"""
import random
from datetime import datetime, timedelta
from typing import List

from .base import RawAsset, RawJob

APPLICATIONS = [
    ("Finance", "Priya Nandakumar", "Critical"),
    ("HR Payroll", "David Chen", "High"),
    ("E-Commerce Platform", "Sofia Alvarez", "Critical"),
    ("Data Warehouse", "James Okoro", "High"),
    ("Corporate Email", "Amir Hassan", "Critical"),
    ("CRM", "Wei Zhang", "Medium"),
    ("Internal Wiki", "Grace Kim", "Low"),
    ("Logistics Tracker", "Marta Kowalski", "Medium"),
    ("Manufacturing MES", "Ravi Deshpande", "High"),
    ("R&D File Store", "Lena Fischer", "Medium"),
]

ENVIRONMENTS = ["Production", "Production", "Production", "Staging", "DR"]


def rand_app():
    return random.choice(APPLICATIONS)


def make_asset(prefix: str, index: int, native_type: str, policy_prefix: str,
                sla_names: List[str], replication_targets: List[str]) -> RawAsset:
    app, owner, _crit = rand_app()
    sla = random.choice(sla_names)
    rpo = random.choice([1, 4, 12, 24, 24, 24, 48])
    repl = random.random() < 0.35
    return RawAsset(
        external_id=f"{prefix}-{index:04d}",
        name=f"{prefix}-{index:03d}",
        native_type=native_type,
        application=app,
        environment=random.choice(ENVIRONMENTS),
        policy_name=f"{policy_prefix}-{sla}",
        sla_name=sla,
        rpo_hours=float(rpo),
        rto_hours=float(random.choice([1, 2, 4, 8, 24])),
        retention_days=random.choice([14, 30, 30, 90, 365]),
        replication_enabled=repl,
        replication_target=random.choice(replication_targets) if repl else None,
        owner=owner,
        tags=[app.split()[0].lower(), random.choice(["tier1", "tier2", "tier3"])],
    )


def make_job_history(asset: RawAsset, statuses: dict, failure_reasons: List[str],
                      lookback_hours: int, jobs_per_asset: int = 3) -> List[RawJob]:
    """statuses: dict of native_status -> weight"""
    jobs = []
    now = datetime.utcnow()
    names, weights = zip(*statuses.items())
    cursor = now - timedelta(hours=random.randint(0, 6))

    for i in range(jobs_per_asset):
        status = random.choices(names, weights=weights, k=1)[0]
        start = cursor - timedelta(hours=(asset.rpo_hours or 24) * (jobs_per_asset - i - 1))
        dur = random.randint(180, 5400)
        end = start + timedelta(seconds=dur) if status != "RUNNING_NATIVE" else None

        jobs.append(RawJob(
            external_asset_id=asset.external_id,
            job_name=f"{asset.policy_name}-{start.strftime('%Y%m%d-%H%M')}",
            policy_name=asset.policy_name,
            start_time=start,
            end_time=end,
            native_status=status,
            failure_reason=random.choice(failure_reasons) if "FAIL" in status.upper() else None,
            rpo_hours=asset.rpo_hours,
            owner=asset.owner,
            duration_seconds=dur if end else int((now - start).total_seconds()),
            bytes_transferred_gb=round(random.uniform(0.5, 850), 2),
        ))
    return jobs
