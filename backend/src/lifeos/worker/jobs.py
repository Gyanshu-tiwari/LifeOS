"""
Optional background worker for async plan generation.

ARQ (backed by Redis) is an OPTIONAL dependency for MVP.
The API falls back to synchronous plan generation when Redis/ARQ
is not available.

To enable background workers:
    uv add arq redis
    export REDIS_URL=redis://localhost:6379
    uv run arq lifeos.worker.jobs.WorkerSettings

Worker functions:
  - run_plan_generation: Full pipeline for a single plan run
"""

import uuid
from typing import Any

from lifeos.core.config import settings
from lifeos.core.logging import get_logger, plan_run_id_var

logger = get_logger(__name__)


async def run_plan_generation(
    ctx: dict[str, Any],
    activity_id: str,
    user_id: str,
    plan_run_id: str | None = None,
    idempotency_key: str | None = None,
) -> dict[str, Any]:
    """
    ARQ job: generate a plan for an activity in the background.

    Creates its own DB session to avoid shared-state issues with the API.
    The background worker owns its own transaction — commits explicitly.
    """
    from lifeos.db.session import AsyncSessionLocal
    from lifeos.agents.orchestrator import PlanOrchestrator

    plan_run_id_var.set(plan_run_id or "")

    logger.info(
        "Worker: plan generation started",
        activity_id=activity_id,
        user_id=user_id,
        plan_run_id=plan_run_id,
    )

    async with AsyncSessionLocal() as db:
        orchestrator = PlanOrchestrator(db)
        run = await orchestrator.run(
            activity_id=uuid.UUID(activity_id),
            user_id=uuid.UUID(user_id),
            idempotency_key=idempotency_key,
        )
        await db.commit()

    logger.info(
        "Worker: plan generation finished",
        activity_id=activity_id,
        run_status=run.status,
        plan_id=str(run.plan_id) if run.plan_id else None,
    )

    return {
        "run_id": str(run.id),
        "status": run.status,
        "plan_id": str(run.plan_id) if run.plan_id else None,
        "error_code": run.error_code,
        "error_message": run.error_message,
    }


async def startup(ctx: dict[str, Any]) -> None:
    logger.info("ARQ worker starting")


async def shutdown(ctx: dict[str, Any]) -> None:
    from lifeos.db.session import engine
    await engine.dispose()
    logger.info("ARQ worker stopped")


def _make_worker_settings():
    """
    Return WorkerSettings class only if arq is installed.
    Avoids ImportError when arq is not a dependency.
    """
    try:
        from arq.connections import RedisSettings
    except ImportError:
        return None

    url = settings.redis_url
    if url.startswith("redis://"):
        parts = url.replace("redis://", "").split(":")
        host = parts[0]
        port = int(parts[1].split("/")[0]) if len(parts) > 1 else 6379
    else:
        host, port = "localhost", 6379

    redis_settings = RedisSettings(host=host, port=port)

    class WorkerSettings:
        functions = [run_plan_generation]
        on_startup = startup
        on_shutdown = shutdown
        redis_settings = redis_settings
        max_jobs = settings.worker_max_jobs
        job_timeout = settings.plan_run_timeout_seconds
        health_check_interval = 30
        queue_name = "lifeos:plans"

    return WorkerSettings


WorkerSettings = _make_worker_settings()
