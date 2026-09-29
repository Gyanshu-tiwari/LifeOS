"""
Activity Understanding Agent.

Input:  raw user intent + optional structured activity context
Output: StructuredActivityContext — a validated, enriched understanding of what
        the user wants to do, with explicit assumptions and missing fields noted.

This agent does NOT call Maps/Places (that's the Maps Agent's job).
It does NOT write to the database.
"""

from typing import Any

from pydantic import BaseModel, Field

from lifeos.core.logging import get_logger
from lifeos.integrations.gemini import generate_structured

logger = get_logger(__name__)

PROMPT_VERSION = "activity_understanding_v1"


class MissingField(BaseModel):
    """A field the system would need but doesn't have yet."""
    field: str
    question: str


class StructuredActivityContext(BaseModel):
    """
    Structured understanding of a user's activity intent.

    This is the output of the Activity Understanding Agent.
    It is validated against this schema before any planning proceeds.
    """
    activity_type: str = Field(
        description="Classified activity type: travel, appointment, errand, interview, relocation, shopping, event, conference, or custom"
    )
    summary: str = Field(
        description="One-sentence human-readable summary of the intent"
    )
    origin: str | None = Field(
        default=None,
        description="Starting location if applicable"
    )
    destination: str | None = Field(
        default=None,
        description="Destination location if applicable"
    )
    travel_mode: str | None = Field(
        default=None,
        description="Travel mode if applicable: DRIVE, TRANSIT, WALK, BICYCLE"
    )
    duration_days: int | None = Field(
        default=None,
        description="Duration in days if specified or can be inferred"
    )
    has_time_constraint: bool = Field(
        default=False,
        description="True if the user has specified a time constraint"
    )
    needs_route: bool = Field(
        default=False,
        description="True if a route/directions would be useful for this activity"
    )
    needs_places: bool = Field(
        default=False,
        description="True if place search (accommodation, restaurants, etc.) would be useful"
    )
    needs_packing_list: bool = Field(
        default=False,
        description="True if a packing list would be useful"
    )
    needs_itinerary: bool = Field(
        default=False,
        description="True if a day-by-day itinerary would be useful"
    )
    key_constraints: list[str] = Field(
        default_factory=list,
        description="Important constraints from the user (budget, dietary, physical, etc.)"
    )
    assumptions: list[str] = Field(
        default_factory=list,
        description="Assumptions the system made due to missing information"
    )
    missing_fields: list[MissingField] = Field(
        default_factory=list,
        description="Fields the system needs but doesn't have — would ask the user"
    )
    confidence: str = Field(
        default="high",
        description="Confidence in the understanding: high, medium, or low"
    )


UNDERSTANDING_PROMPT = """You are an expert activity planner assistant. Your job is to deeply understand a user's intention and extract structured context.

User's raw intent: {raw_intent}

Additional context provided:
- Activity type hint: {activity_type}
- Origin: {origin}
- Destination: {destination}
- Travel mode: {travel_mode}
- Start time: {start_at}
- End time: {end_at}
- Constraints: {constraints}

Instructions:
1. Classify the activity accurately based on the intent.
2. Extract all location, timing, and logistical details.
3. Determine which planning features are needed (route, places, packing, itinerary).
4. Identify assumptions you're making and fields you'd need to clarify.
5. Never invent facts — mark uncertain information clearly.
6. Be conservative: prefer asking over guessing for critical unknowns.

Return a structured JSON object matching the required schema."""


async def understand_activity(
    raw_intent: str,
    activity_type: str = "",
    origin: str | None = None,
    destination: str | None = None,
    travel_mode: str | None = None,
    start_at: str | None = None,
    end_at: str | None = None,
    constraints: dict | None = None,
) -> StructuredActivityContext:
    """
    Run the Activity Understanding Agent.

    Returns a validated StructuredActivityContext.
    Raises RuntimeError if the model output fails validation.
    """
    prompt = UNDERSTANDING_PROMPT.format(
        raw_intent=raw_intent,
        activity_type=activity_type or "unknown",
        origin=origin or "not specified",
        destination=destination or "not specified",
        travel_mode=travel_mode or "not specified",
        start_at=start_at or "not specified",
        end_at=end_at or "not specified",
        constraints=constraints or "none",
    )

    logger.info(
        "Activity understanding started",
        prompt_version=PROMPT_VERSION,
    )

    raw = await generate_structured(prompt, StructuredActivityContext)

    # Validate against schema — AI output is treated as untrusted input
    try:
        context = StructuredActivityContext.model_validate(raw)
    except Exception as exc:
        raise RuntimeError(
            f"Activity Understanding Agent produced invalid output: {exc}"
        ) from exc

    logger.info(
        "Activity understanding complete",
        activity_type=context.activity_type,
        confidence=context.confidence,
        assumptions_count=len(context.assumptions),
    )
    return context
