"""
Maps Agent — computes routes and finds places for a plan.

Uses narrow tool functions from integrations/maps.py and integrations/places.py.
Returns structured summaries for the Planner Agent to use.
Does NOT write to the database directly.
"""

from typing import Any

from lifeos.agents.activity_understanding import StructuredActivityContext
from lifeos.core.logging import get_logger

logger = get_logger(__name__)


async def get_route_context(
    context: StructuredActivityContext,
) -> dict[str, Any] | None:
    """
    Compute route context if the activity needs routing.

    Returns a normalized route summary or None if routing is not needed
    or the Maps API is not configured.
    """
    if not context.needs_route:
        return None
    if not context.origin or not context.destination:
        logger.info(
            "Skipping route computation — origin or destination missing",
            origin=context.origin,
            destination=context.destination,
        )
        return None

    try:
        from lifeos.integrations.maps import compute_route
        route = await compute_route(
            origin=context.origin,
            destination=context.destination,
            mode=context.travel_mode or "DRIVE",
        )
        return route
    except Exception as exc:
        logger.warning(
            "Route computation failed — continuing without route",
            error=str(exc),
        )
        return None


async def get_places_context(
    context: StructuredActivityContext,
    route_summary: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """
    Search for relevant places if the activity benefits from place context.

    Returns a list of normalized place summaries.
    """
    if not context.needs_places:
        return []
    if not context.destination:
        return []

    try:
        from lifeos.integrations.places import search_places
        query = f"things to do in {context.destination}"
        places = await search_places(
            text_query=query,
            max_results=5,
        )
        return places
    except Exception as exc:
        logger.warning(
            "Places search failed — continuing without places",
            error=str(exc),
        )
        return []
