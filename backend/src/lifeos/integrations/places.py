"""
Google Places API (New) integration using httpx.

Implements narrow tools:
  - search_places()
  - search_nearby()
  - get_place_details()
  - search_along_route()
"""

import time
from typing import Any

import httpx

from lifeos.core.config import settings
from lifeos.core.exceptions import ProviderError
from lifeos.core.logging import get_logger

logger = get_logger(__name__)

BASE_URL = "https://places.googleapis.com/v1"
DEFAULT_FIELD_MASK = "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types,places.rating,places.websiteUri,places.nationalPhoneNumber,places.regularOpeningHours"
DETAILS_FIELD_MASK = "id,displayName,formattedAddress,location,primaryType,types,rating,websiteUri,nationalPhoneNumber,regularOpeningHours"


def _get_headers(field_mask: str) -> dict[str, str]:
    if not settings.google_maps_api_key:
        raise ProviderError(
            "GOOGLE_MAPS_API_KEY is not configured",
            provider="google_places",
            retryable=False,
        )
    return {
        "X-Goog-Api-Key": settings.google_maps_api_key,
        "X-Goog-FieldMask": field_mask,
        "Content-Type": "application/json",
    }


def _normalize_place(place: dict[str, Any]) -> dict[str, Any]:
    """Normalize a Google Places (New) result to a consistent format."""
    location = place.get("location", {})
    display_name = place.get("displayName", {}).get("text", "Unknown")
    
    return {
        "provider": "google",
        "provider_place_id": place.get("id"),
        "name": display_name,
        "formatted_address": place.get("formattedAddress"),
        "latitude": location.get("latitude"),
        "longitude": location.get("longitude"),
        "primary_type": place.get("primaryType"),
        "types": place.get("types", []),
        "rating": place.get("rating"),
        "website_uri": place.get("websiteUri"),
        "phone": place.get("nationalPhoneNumber"),
        "opening_hours": place.get("regularOpeningHours"),
        "raw": place,
    }


async def search_places(
    text_query: str,
    location_bias: dict[str, Any] | None = None,
    type_filter: str | None = None,
    max_results: int = 5,
) -> list[dict[str, Any]]:
    """Search for places by text query using Places API (New)."""
    start = time.monotonic()
    try:
        payload: dict[str, Any] = {
            "textQuery": text_query,
            "maxResultCount": max_results,
        }
        if type_filter:
            payload["includedType"] = type_filter
        if location_bias:
            payload["locationBias"] = location_bias

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/places:searchText",
                json=payload,
                headers=_get_headers(DEFAULT_FIELD_MASK),
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()

        latency_ms = int((time.monotonic() - start) * 1000)
        places = [_normalize_place(p) for p in data.get("places", [])]

        logger.info(
            "Places text search complete",
            query=text_query,
            results=len(places),
            latency_ms=latency_ms,
        )
        return places

    except Exception as exc:
        raise ProviderError(
            f"Places search failed: {exc}",
            provider="google_places",
            retryable=True,
        ) from exc


async def search_nearby(
    location: tuple[float, float],
    types: list[str],
    radius_meters: float = 5000.0,
    max_results: int = 10,
) -> list[dict[str, Any]]:
    """Search for places near a lat/lng location."""
    start = time.monotonic()
    try:
        payload: dict[str, Any] = {
            "locationRestriction": {
                "circle": {
                    "center": {
                        "latitude": location[0],
                        "longitude": location[1],
                    },
                    "radius": radius_meters,
                }
            },
            "maxResultCount": max_results,
        }
        if types:
            payload["includedTypes"] = types

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/places:searchNearby",
                json=payload,
                headers=_get_headers(DEFAULT_FIELD_MASK),
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()

        latency_ms = int((time.monotonic() - start) * 1000)
        places = [_normalize_place(p) for p in data.get("places", [])]

        logger.info(
            "Nearby search complete",
            location=location,
            radius=radius_meters,
            types=types,
            results=len(places),
            latency_ms=latency_ms,
        )
        return places

    except Exception as exc:
        raise ProviderError(
            f"Nearby search failed: {exc}",
            provider="google_places",
            retryable=True,
        ) from exc


async def get_place_details(
    provider_place_id: str,
    fields: list[str] | None = None,
) -> dict[str, Any]:
    """Get detailed information about a specific place."""
    start = time.monotonic()
    try:
        field_mask = ",".join(fields) if fields else DETAILS_FIELD_MASK
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BASE_URL}/places/{provider_place_id}",
                headers=_get_headers(field_mask),
                timeout=10.0,
            )
            response.raise_for_status()
            place_data = response.json()

        latency_ms = int((time.monotonic() - start) * 1000)
        normalized = _normalize_place(place_data)

        logger.info(
            "Place details fetched",
            place_id=provider_place_id,
            name=normalized.get("name"),
            latency_ms=latency_ms,
        )
        return normalized

    except Exception as exc:
        raise ProviderError(
            f"Place details fetch failed: {exc}",
            provider="google_places",
            retryable=True,
        ) from exc


async def search_along_route(
    text_query: str,
    polyline: str,
    max_results: int = 10,
) -> list[dict[str, Any]]:
    """Search for places along an encoded polyline route."""
    start = time.monotonic()
    try:
        payload: dict[str, Any] = {
            "textQuery": text_query,
            "maxResultCount": max_results,
            "searchAlongRouteParameters": {
                "polyline": {
                    "encodedPolyline": polyline
                }
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/places:searchText",
                json=payload,
                headers=_get_headers(DEFAULT_FIELD_MASK),
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()

        latency_ms = int((time.monotonic() - start) * 1000)
        places = [_normalize_place(p) for p in data.get("places", [])]

        logger.info(
            "Search along route complete",
            query=text_query,
            results=len(places),
            latency_ms=latency_ms,
        )
        return places

    except Exception as exc:
        raise ProviderError(
            f"Search along route failed: {exc}",
            provider="google_places",
            retryable=True,
        ) from exc
