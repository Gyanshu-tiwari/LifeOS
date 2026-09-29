import asyncio
import json
import uuid

from fastapi import APIRouter, Query, status
from fastapi.responses import StreamingResponse

from lifeos.agents.orchestrator import PlanOrchestrator
from lifeos.core.security import CurrentUser
from lifeos.db.deps import DbSession
from lifeos.repositories.plan_run import PlanRunRepository
from lifeos.repositories.user import UserRepository
from lifeos.schemas.activity import (
    ActivityCreate,
    ActivityListResponse,
    ActivityResponse,
    ActivityUpdate,
)
from lifeos.schemas.plan_run import PlanRunResponse, PlanRunStartRequest
from lifeos.services.activity_service import ActivityService

router = APIRouter()


def _svc(db: DbSession) -> ActivityService:
    return ActivityService(db)


@router.post(
    "",
    response_model=ActivityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create activity from intent",
    description=(
        "Captures a user's natural-language intention and optional structured "
        "constraints as a new Activity. The activity is the stable source context "
        "from which one or more Plans can be generated."
    ),
)
async def create_activity(
    payload: ActivityCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> ActivityResponse:
    svc = _svc(db)
    activity = await svc.create_activity(payload, current_user)
    return ActivityResponse.model_validate(activity)


@router.get(
    "",
    response_model=ActivityListResponse,
    summary="List user activities",
)
async def list_activities(
    db: DbSession,
    current_user: CurrentUser,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    status: str | None = Query(default=None, description="Filter by status"),
) -> ActivityListResponse:
    svc = _svc(db)
    items, total = await svc.list_activities(
        verified=current_user,
        limit=limit,
        offset=offset,
        status_filter=status,
    )
    return ActivityListResponse(
        items=[ActivityResponse.model_validate(a) for a in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{activity_id}",
    response_model=ActivityResponse,
    summary="Get a single activity",
)
async def get_activity(
    activity_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> ActivityResponse:
    svc = _svc(db)
    activity = await svc.get_activity(activity_id, current_user)
    return ActivityResponse.model_validate(activity)


@router.patch(
    "/{activity_id}",
    response_model=ActivityResponse,
    summary="Update an activity",
    description="Partially update an activity's fields. Only supplied (non-null) fields are modified.",
)
async def update_activity(
    activity_id: uuid.UUID,
    payload: ActivityUpdate,
    db: DbSession,
    current_user: CurrentUser,
) -> ActivityResponse:
    svc = _svc(db)
    activity = await svc.update_activity(activity_id, payload, current_user)
    return ActivityResponse.model_validate(activity)


@router.post(
    "/{activity_id}/plan-runs",
    response_model=PlanRunResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Start plan generation",
    description=(
        "Enqueues an async AI plan generation run. "
        "Returns 202 Accepted immediately with a QUEUED run record. "
        "Poll GET /{activity_id}/plan-runs/{run_id} or stream SSE for progress. "
        "Idempotency key prevents duplicate enqueues."
    ),
)
async def start_plan_run(
    activity_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
    payload: PlanRunStartRequest | None = None,
) -> PlanRunResponse:
    user_repo = UserRepository(db)
    user, _ = await user_repo.get_or_create(
        firebase_uid=current_user.firebase_uid,
        email=current_user.email,
        display_name=current_user.display_name,
    )

    idempotency_key = payload.idempotency_key if payload else None

    # Idempotency: return existing run if key matches
    if idempotency_key:
        run_repo = PlanRunRepository(db)
        existing = await run_repo.get_by_idempotency_key(idempotency_key)
        if existing:
            return PlanRunResponse.model_validate(existing)

    # Try async enqueue via ARQ; fall back to synchronous if Redis unavailable
    try:
        from lifeos.worker.queue import get_arq_pool
        from lifeos.worker.jobs import run_plan_generation
        pool = await get_arq_pool()
        if pool is not None:
            # Create QUEUED run record first so we can return it immediately
            orchestrator = PlanOrchestrator(db)
            from lifeos.repositories.activity import ActivityRepository
            activity_repo = ActivityRepository(db)
            activity = await activity_repo.get_by_id_and_user(activity_id, user.id)
            if activity is None:
                from lifeos.core.exceptions import NotFoundError
                raise NotFoundError(f"Activity {activity_id} not found")
            run = await orchestrator.create_plan_run(activity, idempotency_key)
            # Enqueue background job
            await pool.enqueue_job(
                "run_plan_generation",
                activity_id=str(activity_id),
                user_id=str(user.id),
                plan_run_id=str(run.id),
                idempotency_key=idempotency_key,
                _job_id=str(run.id),  # use run ID as job ID for dedup
            )
            return PlanRunResponse.model_validate(run)
    except ImportError:
        pass  # ARQ not available
    except Exception:
        pass  # Redis unavailable — fall through to synchronous

    # Synchronous fallback (no Redis)
    orchestrator = PlanOrchestrator(db)
    run = await orchestrator.run(
        activity_id=activity_id,
        user_id=user.id,
        idempotency_key=idempotency_key,
    )
    return PlanRunResponse.model_validate(run)


@router.get(
    "/{activity_id}/plan-runs/{run_id}",
    response_model=PlanRunResponse,
    summary="Get plan run status",
)
async def get_plan_run(
    activity_id: uuid.UUID,
    run_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> PlanRunResponse:
    svc = _svc(db)
    await svc.get_activity(activity_id, current_user)  # ownership check
    run_repo = PlanRunRepository(db)
    run = await run_repo.get_by_id(run_id)
    if run is None:
        from lifeos.core.exceptions import NotFoundError
        raise NotFoundError(f"PlanRun {run_id} not found", code="PLAN_RUN_NOT_FOUND")
    return PlanRunResponse.model_validate(run)


@router.get(
    "/{activity_id}/plan-runs/{run_id}/events",
    summary="SSE: stream plan run progress",
    description=(
        "Server-Sent Events stream for a plan run. "
        "Sends status updates as the run progresses through QUEUED → RUNNING → SUCCEEDED/FAILED. "
        "Closes automatically when the run reaches a terminal state."
    ),
    response_class=StreamingResponse,
)
async def stream_plan_run_events(
    activity_id: uuid.UUID,
    run_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
    poll_interval: float = Query(default=1.0, ge=0.5, le=5.0),
):
    """SSE stream that polls PlanRun status until terminal state."""
    svc = _svc(db)
    await svc.get_activity(activity_id, current_user)  # ownership check

    async def event_generator():
        terminal = {"SUCCEEDED", "FAILED", "CANCELLED"}
        consecutive_errors = 0

        while True:
            try:
                from lifeos.db.session import AsyncSessionLocal
                async with AsyncSessionLocal() as session:
                    run_repo = PlanRunRepository(session)
                    run = await run_repo.get_by_id(run_id)

                if run is None:
                    data = json.dumps({"error": "run_not_found", "run_id": str(run_id)})
                    yield f"event: error\ndata: {data}\n\n"
                    break

                event_data = {
                    "run_id": str(run.id),
                    "status": run.status,
                    "plan_id": str(run.plan_id) if run.plan_id else None,
                    "error_code": run.error_code,
                }
                yield f"event: status\ndata: {json.dumps(event_data)}\n\n"
                consecutive_errors = 0

                if run.status in terminal:
                    yield "event: done\ndata: {}\n\n"
                    break

            except Exception as exc:
                consecutive_errors += 1
                if consecutive_errors >= 3:
                    yield f"event: error\ndata: {{\"message\": \"{exc}\"}}\n\n"
                    break

            await asyncio.sleep(poll_interval)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get(
    "/{activity_id}/plan-runs",
    summary="List plan runs for an activity",
)
async def list_plan_runs(
    activity_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> dict:
    svc = _svc(db)
    await svc.get_activity(activity_id, current_user)  # ownership check
    run_repo = PlanRunRepository(db)
    runs = await run_repo.list_for_activity(activity_id)
    return {
        "items": [PlanRunResponse.model_validate(r).model_dump() for r in runs],
        "total": len(runs),
    }
