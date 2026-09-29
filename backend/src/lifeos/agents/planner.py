"""
Planner Agent — generates a structured Plan from activity context.

Input:  StructuredActivityContext + optional routes/places
Output: PlannerOutput — sections with tasks, packing items, itinerary

All output is validated against schema BEFORE persistence.
"""

from typing import Any

from pydantic import BaseModel, Field

from lifeos.agents.activity_understanding import StructuredActivityContext
from lifeos.core.logging import get_logger
from lifeos.integrations.gemini import generate_structured

logger = get_logger(__name__)

PROMPT_VERSION = "planner_v1"


class TaskOutput(BaseModel):
    title: str
    description: str | None = None
    priority: str = Field(default="MEDIUM", description="ESSENTIAL, HIGH, MEDIUM, or LOW")
    estimated_minutes: int | None = None
    depends_on_titles: list[str] = Field(
        default_factory=list,
        description="Titles of tasks this task depends on (must be in same section)"
    )
    provider_place_id: str | None = Field(
        default=None,
        description="Must be set to the provider_place_id if this task refers to a specific verified place from context."
    )


class SectionOutput(BaseModel):
    title: str
    section_type: str = Field(
        description="preparation, journey, destination, arrival, administrative, or general"
    )
    order_index: int
    tasks: list[TaskOutput]


class PackingItemOutput(BaseModel):
    item: str
    category: str
    priority: str = Field(description="ESSENTIAL, RECOMMENDED, or OPTIONAL")
    reason: str | None = None


class ItineraryItemOutput(BaseModel):
    title: str
    description: str | None = None
    day: int | None = None  # Day number (1-based) if applicable
    duration_minutes: int | None = None
    provider_place_id: str | None = Field(
        default=None,
        description="Must be set to the provider_place_id if this itinerary item refers to a specific verified place from context."
    )


class PlannerOutput(BaseModel):
    """
    Structured plan output from the Planner Agent.
    Validated before any database persistence.
    """
    title: str = Field(description="Human-readable plan title")
    sections: list[SectionOutput] = Field(
        description="Plan sections in order — each with tasks"
    )
    packing_items: list[PackingItemOutput] = Field(
        default_factory=list,
        description="Items to pack/prepare — only if relevant"
    )
    itinerary_items: list[ItineraryItemOutput] = Field(
        default_factory=list,
        description="Day/time schedule items — only if relevant"
    )
    plan_notes: str | None = Field(
        default=None,
        description="Important notes, warnings, or recommendations"
    )


PLANNER_PROMPT = """You are an expert activity planner. Generate a structured, actionable plan.

Activity Context:
- Type: {activity_type}
- Summary: {summary}
- Origin: {origin}
- Destination: {destination}
- Travel mode: {travel_mode}
- Duration: {duration_days} days
- Needs route: {needs_route}
- Needs places: {needs_places}
- Needs packing list: {needs_packing_list}
- Needs itinerary: {needs_itinerary}
- Key constraints: {key_constraints}
- Assumptions: {assumptions}

Planning instructions:
1. Create logical sections (e.g. Preparation, Journey, Destination, Return).
2. Each section has ordered, actionable tasks.
3. Tasks should have clear titles, priority, and estimated time.
4. Express task dependencies by referencing titles of prerequisite tasks in the same section.
5. Avoid circular dependencies — tasks must form a directed acyclic graph.
6. Include packing items only if needs_packing_list is true.
7. Include itinerary items only if needs_itinerary is true.
8. Label any inference/recommendation explicitly in descriptions.
9. UNVERIFIED AI PLACE ≠ VERIFIED LIFEOS PLACE. Do NOT invent specific facts (hotel names, restaurant names).
10. If a task or itinerary item refers to a specific real-world place, you MUST use a verified place from the Places context and set its `provider_place_id`.
11. Keep tasks actionable — the user should be able to execute them without rewriting.

Return a structured JSON object matching the required schema."""


async def generate_plan(
    context: StructuredActivityContext,
    route_summary: dict | None = None,
    places_summary: list[dict] | None = None,
) -> PlannerOutput:
    """
    Run the Planner Agent to generate a structured plan draft.

    Returns a validated PlannerOutput.
    Raises RuntimeError if the model output fails validation.
    """
    prompt = PLANNER_PROMPT.format(
        activity_type=context.activity_type,
        summary=context.summary,
        origin=context.origin or "not specified",
        destination=context.destination or "not specified",
        travel_mode=context.travel_mode or "not specified",
        duration_days=context.duration_days or "not specified",
        needs_route=context.needs_route,
        needs_places=context.needs_places,
        needs_packing_list=context.needs_packing_list,
        needs_itinerary=context.needs_itinerary,
        key_constraints=context.key_constraints or "none",
        assumptions=context.assumptions or "none",
    )

    if route_summary:
        prompt += f"\n\nRoute context: {route_summary}"
    if places_summary:
        prompt += f"\n\nPlaces context: {places_summary}"

    logger.info(
        "Plan generation started",
        prompt_version=PROMPT_VERSION,
        activity_type=context.activity_type,
    )

    raw = await generate_structured(prompt, PlannerOutput)

    try:
        plan = PlannerOutput.model_validate(raw)
    except Exception as exc:
        raise RuntimeError(f"Planner Agent produced invalid output: {exc}") from exc

    logger.info(
        "Plan generation complete",
        sections=len(plan.sections),
        packing_items=len(plan.packing_items),
        itinerary_items=len(plan.itinerary_items),
    )
    return plan
