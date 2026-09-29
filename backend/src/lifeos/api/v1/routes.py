"""
Routes API — compute and retrieve route information.

Endpoints:
  POST /api/v1/routes/compute    Compute a route
  GET  /api/v1/routes/{id}       Get stored route
"""

import uuid
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from lifeos.core.security import CurrentUser
from lifeos.db.deps import DbSession

router = APIRouter()


class RouteComputeRequest(BaseModel):
    origin: str
    destination: str
    travel_mode: str = "DRIVE"


@router.post(
    "/compute",
    summary="Compute a route",
    description="Compute route details between two locations. Requires GOOGLE_MAPS_API_KEY.",
)
async def compute_route_endpoint(
    payload: RouteComputeRequest,
    db: DbSession,
    current_user: CurrentUser,
) -> dict[str, Any]:
    from lifeos.integrations.maps import compute_route
    result = await compute_route(
        origin=payload.origin,
        destination=payload.destination,
        mode=payload.travel_mode,
    )
    # Strip raw provider data before returning
    result.pop("latency_ms", None)
    return result
