"""
Google Maps Routes API integration using httpx.

Implements narrow tools:
  - compute_route()
  - compute_route_matrix()
"""

import time
from typing import Any

import httpx

from lifeos.core.config import settings
from lifeos.core.exceptions import ProviderError
from lifeos.core.logging import get_logger

logger = get_logger(__name__)

ROUTES_BASE_URL = "https://routes.googleapis.com"


def _get_headers(field_mask: str) -> dict[str, str]:
    if not settings.google_maps_api_key:
        raise ProviderError(
            "GOOGLE_MAPS_API_KEY is not configured",
            provider="google_maps",
            retryable=False,
        )
    return {
        "X-Goog-Api-Key": settings.google_maps_api_key,
        "X-Goog-FieldMask": field_mask,
        "Content-Type": "application/json",
    }


async def compute_route(
    origin: str,
    destination: str,
    mode: str = "DRIVE",
    departure_time: str | None = None,
) -> dict[str, Any]:
    """Compute a route between origin and destination."""
    start = time.monotonic()
    
    try:
        # Convert mode to Routes API format
        mode_upper = mode.upper().replace("_", "")
        if mode_upper in ("DRIVING", "DRIVE"):
            mode_upper = "DRIVE"
        elif mode_upper == "TRANSIT":
            mode_upper = "TRANSIT"
        elif mode_upper in ("WALK", "WALKING"):
            mode_upper = "WALK"

        payload = {
            "origin": {"address": origin},
            "destination": {"address": destination},
            "travelMode": mode_upper,
        }

        field_mask = "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{ROUTES_BASE_URL}/directions/v2:computeRoutes",
                json=payload,
                headers=_get_headers(field_mask),
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()

        latency_ms = int((time.monotonic() - start) * 1000)

        routes = data.get("routes", [])
        if not routes:
            raise ProviderError(
                f"No route found from {origin!r} to {destination!r}",
                provider="google_maps",
                retryable=False,
            )

        route = routes[0]
        duration_str = route.get("duration", "0s")
        duration_seconds = int(duration_str.rstrip("s")) if duration_str.endswith("s") else 0

        normalized = {
            "origin_text": origin,
            "destination_text": destination,
            "travel_mode": mode,
            "distance_meters": route.get("distanceMeters", 0),
            "duration_seconds": duration_seconds,
            "polyline": route.get("polyline", {}).get("encodedPolyline", ""),
            "provider": "google",
            "latency_ms": latency_ms,
            "raw": data,
        }

        logger.info(
            "Route computed",
            origin=origin,
            destination=destination,
            mode=mode,
            distance_km=round(normalized["distance_meters"] / 1000, 1),
            duration_min=round(normalized["duration_seconds"] / 60, 0),
            latency_ms=latency_ms,
        )
        return normalized

    except ProviderError:
        raise
    except Exception as exc:
        raise ProviderError(
            f"Route computation failed: {exc}",
            provider="google_maps",
            retryable=True,
        ) from exc


async def compute_route_matrix(
    origins: list[str],
    destinations: list[str],
    mode: str = "DRIVE",
) -> list[dict[str, Any]]:
    """Compute distances/durations for all origin-destination pairs."""
    start = time.monotonic()
    
    try:
        mode_upper = mode.upper().replace("_", "")
        if mode_upper in ("DRIVING", "DRIVE"):
            mode_upper = "DRIVE"
        elif mode_upper == "TRANSIT":
            mode_upper = "TRANSIT"
        elif mode_upper in ("WALK", "WALKING"):
            mode_upper = "WALK"

        payload = {
            "origins": [{"waypoint": {"address": o}} for o in origins],
            "destinations": [{"waypoint": {"address": d}} for d in destinations],
            "travelMode": mode_upper,
        }

        field_mask = "originIndex,destinationIndex,distanceMeters,duration,status"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{ROUTES_BASE_URL}/distanceMatrix/v2:computeRouteMatrix",
                json=payload,
                headers=_get_headers(field_mask),
                timeout=15.0,
            )
            response.raise_for_status()
            
            # The matrix endpoint sometimes streams NDJSON or returns an array.
            # Usually it's a JSON array for standard REST calls.
            data = response.json()

        latency_ms = int((time.monotonic() - start) * 1000)

        results = []
        for element in data:
            if element.get("status", {}).get("code") == 0 or "status" not in element:
                idx_o = element.get("originIndex", 0)
                idx_d = element.get("destinationIndex", 0)
                duration_str = element.get("duration", "0s")
                duration_seconds = int(duration_str.rstrip("s")) if duration_str.endswith("s") else 0
                
                results.append({
                    "origin": origins[idx_o],
                    "destination": destinations[idx_d],
                    "distance_meters": element.get("distanceMeters", 0),
                    "duration_seconds": duration_seconds,
                })

        logger.info(
            "Route matrix computed",
            origins=len(origins),
            destinations=len(destinations),
            results=len(results),
            latency_ms=latency_ms,
        )
        return results

    except Exception as exc:
        raise ProviderError(
            f"Route matrix computation failed: {exc}",
            provider="google_maps",
            retryable=True,
        ) from exc
