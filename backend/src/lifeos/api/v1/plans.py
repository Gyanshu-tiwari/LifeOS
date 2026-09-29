"""
Plans API routes.

Endpoints:
  GET    /api/v1/plans/{id}                         Get plan overview
  GET    /api/v1/plans/{id}/progress                Task completion progress
  GET    /api/v1/plans/{id}/next-action             Next actionable task
  GET    /api/v1/plans/{id}/places                  Places linked to plan
  GET    /api/v1/plans/{id}/route                   Computed route
  GET    /api/v1/plans/{id}/packing                 Packing list
  PATCH  /api/v1/plans/{id}/packing/{item_id}       Toggle item packed/unpacked
  GET    /api/v1/plans/{id}/itinerary               Itinerary items
  PATCH  /api/v1/plans/{id}/itinerary/{item_id}     Update itinerary item
  POST   /api/v1/plans/{id}/route/recalculate       Recalculate route (stub)
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, status

from lifeos.core.exceptions import NotFoundError
from lifeos.core.security import CurrentUser
from lifeos.db.deps import DbSession
from lifeos.repositories.user import UserRepository
from lifeos.schemas.plan import (
    ItineraryItemResponse,
    ItineraryItemUpdate,
    NextActionResponse,
    PackingItemResponse,
    PackingItemUpdate,
    PlaceResponse,
    PlanProgressResponse,
    PlanResponse,
    RouteResponse,
)
from lifeos.services.plan_service import PlanService

router = APIRouter()


async def _get_user_id(db: DbSession, current_user: CurrentUser) -> uuid.UUID:
    repo = UserRepository(db)
    user, _ = await repo.get_or_create(
        firebase_uid=current_user.firebase_uid,
        email=current_user.email,
        display_name=current_user.display_name,
    )
    return user.id


@router.get(
    "/{plan_id}",
    response_model=PlanResponse,
    summary="Get plan overview",
)
async def get_plan(
    plan_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> PlanResponse:
    user_id = await _get_user_id(db, current_user)
    svc = PlanService(db)
    plan = await svc.get_plan(plan_id, user_id)
    return PlanResponse.model_validate(plan)


@router.get(
    "/{plan_id}/progress",
    response_model=PlanProgressResponse,
    summary="Get plan progress summary",
)
async def get_plan_progress(
    plan_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> PlanProgressResponse:
    user_id = await _get_user_id(db, current_user)
    svc = PlanService(db)
    return await svc.get_plan_progress(plan_id, user_id)


@router.get(
    "/{plan_id}/next-action",
    response_model=NextActionResponse,
    summary="Get next actionable task",
    description=(
        "Returns the highest-priority unblocked task that can be started now, "
        "considering task dependencies and completion status. "
        "This is LIFEOS's core 'What should I do next?' capability."
    ),
)
async def get_next_action(
    plan_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> NextActionResponse:
    user_id = await _get_user_id(db, current_user)
    svc = PlanService(db)
    return await svc.get_next_action(plan_id, user_id)


@router.get(
    "/{plan_id}/places",
    response_model=list[PlaceResponse],
    summary="Get places linked to this plan",
)
async def get_plan_places(
    plan_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> list[PlaceResponse]:
    user_id = await _get_user_id(db, current_user)
    svc = PlanService(db)
    await svc.get_plan(plan_id, user_id)  # ownership check

    from lifeos.repositories.place import PlaceRepository
    place_repo = PlaceRepository(db)
    places = await place_repo.get_places_for_plan(plan_id)
    return [PlaceResponse.model_validate(p) for p in places]


@router.get(
    "/{plan_id}/route",
    response_model=RouteResponse | None,
    summary="Get computed route for this plan",
)
async def get_plan_route(
    plan_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> RouteResponse | None:
    user_id = await _get_user_id(db, current_user)
    svc = PlanService(db)
    await svc.get_plan(plan_id, user_id)  # ownership check

    from lifeos.repositories.route import RouteRepository
    route_repo = RouteRepository(db)
    route = await route_repo.get_route_for_plan(plan_id)
    if route is None:
        return None
    return RouteResponse.model_validate(route)


@router.get(
    "/{plan_id}/packing",
    response_model=list[PackingItemResponse],
    summary="Get packing list for this plan",
)
async def get_packing_list(
    plan_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> list[PackingItemResponse]:
    user_id = await _get_user_id(db, current_user)
    svc = PlanService(db)
    await svc.get_plan(plan_id, user_id)  # ownership check

    from sqlalchemy import select
    from lifeos.db.models.packing_item import PackingItem
    from sqlalchemy.ext.asyncio import AsyncSession

    result = await db.execute(
        select(PackingItem)
        .where(PackingItem.plan_id == plan_id)
        .order_by(PackingItem.priority, PackingItem.item)
    )
    items = list(result.scalars().all())
    return [PackingItemResponse.model_validate(i) for i in items]


@router.patch(
    "/{plan_id}/packing/{item_id}",
    response_model=PackingItemResponse,
    summary="Update packing item (mark packed/unpacked)",
)
async def update_packing_item(
    plan_id: uuid.UUID,
    item_id: uuid.UUID,
    payload: PackingItemUpdate,
    db: DbSession,
    current_user: CurrentUser,
) -> PackingItemResponse:
    user_id = await _get_user_id(db, current_user)
    svc = PlanService(db)
    await svc.get_plan(plan_id, user_id)  # ownership check

    from sqlalchemy import select
    from lifeos.db.models.packing_item import PackingItem

    result = await db.execute(
        select(PackingItem).where(
            PackingItem.id == item_id,
            PackingItem.plan_id == plan_id,
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise NotFoundError(f"PackingItem {item_id} not found", code="PACKING_ITEM_NOT_FOUND")

    # Handle pack/unpack toggle
    if payload.checked is True:
        item.checked_at = datetime.now(tz=timezone.utc)
    elif payload.checked is False:
        item.checked_at = None

    for field in ("item", "category", "priority", "reason"):
        val = getattr(payload, field, None)
        if val is not None:
            setattr(item, field, val)

    return PackingItemResponse.model_validate(item)


@router.get(
    "/{plan_id}/itinerary",
    response_model=list[ItineraryItemResponse],
    summary="Get itinerary for this plan",
)
async def get_itinerary(
    plan_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> list[ItineraryItemResponse]:
    user_id = await _get_user_id(db, current_user)
    svc = PlanService(db)
    await svc.get_plan(plan_id, user_id)  # ownership check

    from sqlalchemy import select
    from lifeos.db.models.itinerary_item import ItineraryItem

    result = await db.execute(
        select(ItineraryItem)
        .where(ItineraryItem.plan_id == plan_id)
        .order_by(ItineraryItem.order_index)
    )
    items = list(result.scalars().all())
    return [ItineraryItemResponse.model_validate(i) for i in items]


@router.patch(
    "/{plan_id}/itinerary/{item_id}",
    response_model=ItineraryItemResponse,
    summary="Update itinerary item status or schedule",
)
async def update_itinerary_item(
    plan_id: uuid.UUID,
    item_id: uuid.UUID,
    payload: ItineraryItemUpdate,
    db: DbSession,
    current_user: CurrentUser,
) -> ItineraryItemResponse:
    user_id = await _get_user_id(db, current_user)
    svc = PlanService(db)
    await svc.get_plan(plan_id, user_id)  # ownership check

    from sqlalchemy import select
    from lifeos.db.models.itinerary_item import ItineraryItem

    result = await db.execute(
        select(ItineraryItem).where(
            ItineraryItem.id == item_id,
            ItineraryItem.plan_id == plan_id,
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise NotFoundError(f"ItineraryItem {item_id} not found", code="ITINERARY_ITEM_NOT_FOUND")

    for field in ("status", "start_at", "end_at", "title", "description"):
        val = getattr(payload, field, None)
        if val is not None:
            setattr(item, field, val)

    return ItineraryItemResponse.model_validate(item)


@router.post(
    "/{plan_id}/route/recalculate",
    response_model=RouteResponse | None,
    summary="Recalculate route for this plan",
    description=(
        "Re-runs the Maps integration for this plan using the activity's "
        "origin/destination. Overwrites the existing route record."
    ),
)
async def recalculate_route(
    plan_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> RouteResponse | None:
    user_id = await _get_user_id(db, current_user)
    svc = PlanService(db)
    plan = await svc.get_plan(plan_id, user_id)

    # Load the plan's activity to get origin/destination
    from sqlalchemy import select
    from lifeos.db.models.activity import Activity
    from lifeos.db.models.route import Route
    from lifeos.repositories.route import RouteRepository
    from lifeos.integrations.maps import compute_route
    from lifeos.core.exceptions import ProviderError

    result = await db.execute(
        select(Activity).where(Activity.id == plan.activity_id)
    )
    activity = result.scalar_one_or_none()

    if not activity or not activity.origin_text or not activity.destination_text:
        return None

    try:
        route_data = await compute_route(
            activity.origin_text,
            activity.destination_text,
            travel_mode=activity.travel_mode or "DRIVE",
        )
    except ProviderError:
        return None

    route_repo = RouteRepository(db)

    # Remove old route if exists
    existing = await route_repo.get_route_for_plan(plan_id)
    if existing:
        await db.delete(existing)
        await db.flush()

    route = await route_repo.create_route(plan_id, {
        "origin_text": activity.origin_text,
        "destination_text": activity.destination_text,
        "travel_mode": activity.travel_mode or "DRIVE",
        "distance_meters": route_data.get("distance_meters"),
        "duration_seconds": route_data.get("duration_seconds"),
        "polyline": route_data.get("polyline"),
        "provider": "google",
    })
    return RouteResponse.model_validate(route)
