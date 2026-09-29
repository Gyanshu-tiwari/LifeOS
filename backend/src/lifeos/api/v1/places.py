"""
Places API routes — Phase 6 implementation.

Endpoints:
  GET  /api/v1/places/search     Text search
  GET  /api/v1/places/nearby     Nearby search
  GET  /api/v1/places/{id}       Get saved place by internal UUID
"""

import uuid
from typing import Any

from fastapi import APIRouter, Query

from lifeos.core.security import CurrentUser
from lifeos.db.deps import DbSession

router = APIRouter()


@router.get(
    "/search",
    summary="Search places by text",
    description="Search for places using a text query. Requires GOOGLE_MAPS_API_KEY.",
)
async def search_places_endpoint(
    q: str = Query(..., description="Search query, e.g. 'hotels in Manali'"),
    max_results: int = Query(default=5, ge=1, le=20),
    current_user: CurrentUser = None,
    db: DbSession = None,
) -> dict[str, Any]:
    from lifeos.integrations.places import search_places
    results = await search_places(text_query=q, max_results=max_results)
    return {"query": q, "results": results, "total": len(results)}


@router.get(
    "/nearby",
    summary="Search places near a location",
)
async def search_nearby_endpoint(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    types: str = Query(default="restaurant", description="Comma-separated place types"),
    radius_meters: int = Query(default=5000, ge=100, le=50000),
    max_results: int = Query(default=10, ge=1, le=20),
    current_user: CurrentUser = None,
    db: DbSession = None,
) -> dict[str, Any]:
    from lifeos.integrations.places import search_nearby
    type_list = [t.strip() for t in types.split(",")]
    results = await search_nearby(
        location=(lat, lng),
        types=type_list,
        radius_meters=radius_meters,
        max_results=max_results,
    )
    return {"location": {"lat": lat, "lng": lng}, "results": results, "total": len(results)}
