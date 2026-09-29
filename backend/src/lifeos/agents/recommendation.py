"""
Recommendation Agent — discovers relevant real-world places based on activity context.

AI reasons. Tools provide reality.
"""

from typing import Any

from pydantic import BaseModel, Field

from lifeos.agents.activity_understanding import StructuredActivityContext
from lifeos.core.logging import get_logger
from lifeos.integrations.gemini import generate_structured
from lifeos.integrations.places import search_places, search_along_route

logger = get_logger(__name__)

PROMPT_VERSION = "recommendation_v1"


class SearchQuery(BaseModel):
    category: str = Field(description="The Google Places type (e.g., 'gas_station', 'restaurant', 'tourist_attraction', 'hospital')")
    search_type: str = Field(description="'destination' for places at the destination, 'route' for places along the route")
    reason: str = Field(description="Why this category is relevant to the activity")


class RecommendationOutput(BaseModel):
    queries: list[SearchQuery] = Field(description="Searches to perform to find relevant places")


RECOMMENDATION_PROMPT = """You are an expert location context recommender.

Activity Context:
- Type: {activity_type}
- Summary: {summary}
- Origin: {origin}
- Destination: {destination}
- Travel mode: {travel_mode}
- Duration: {duration_days} days

Determine what kinds of real-world places are useful for this activity.
Output a list of search queries. Do NOT invent specific places (e.g., "McDonalds").
Instead, return categories like "restaurant", "gas_station", "hospital", "parking".

Set search_type to:
- "route" if it's something needed along the journey (e.g., gas station, rest stop, scenic stop).
- "destination" if it's something needed at the destination (e.g., attractions, parking near the hospital, restaurants in the city).

Only include categories that are highly relevant to the context. Keep the list small (max 4 queries)."""


async def get_recommended_places(
    context: StructuredActivityContext,
    route_summary: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """
    Reason about needed places and discover them via Google APIs.
    """
    if not context.needs_places:
        return []
    
    prompt = RECOMMENDATION_PROMPT.format(
        activity_type=context.activity_type,
        summary=context.summary,
        origin=context.origin or "not specified",
        destination=context.destination or "not specified",
        travel_mode=context.travel_mode or "not specified",
        duration_days=context.duration_days or "not specified",
    )

    logger.info("Recommendation reasoning started")
    try:
        raw = await generate_structured(prompt, RecommendationOutput)
        recommendation = RecommendationOutput.model_validate(raw)
    except Exception as exc:
        logger.warning(f"Recommendation reasoning failed: {exc}")
        return []

    logger.info(
        "Recommendation reasoning complete",
        queries=len(recommendation.queries)
    )

    all_places = []
    seen_ids = set()

    # We do a maximum of 4 API calls to save quota and time.
    for query in recommendation.queries[:4]:
        try:
            if query.search_type == "route" and route_summary and route_summary.get("polyline"):
                places = await search_along_route(
                    text_query=query.category,
                    polyline=route_summary["polyline"],
                    max_results=3,
                )
            elif context.destination:
                places = await search_places(
                    text_query=f"{query.category} in {context.destination}",
                    max_results=3,
                )
            else:
                continue

            for p in places:
                pid = p.get("provider_place_id")
                if pid and pid not in seen_ids:
                    seen_ids.add(pid)
                    all_places.append(p)
        except Exception as exc:
            logger.warning(f"Place search failed for category '{query.category}': {exc}")

    return all_places
