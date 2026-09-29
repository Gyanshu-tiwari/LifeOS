"""
Web search integration stub.

In production, this would use Gemini's search grounding capability or
a dedicated search API. For now, it records tool calls and returns a
placeholder indicating search is configured but not yet live.
"""

import time
from typing import Any

from lifeos.core.config import settings
from lifeos.core.logging import get_logger

logger = get_logger(__name__)


async def search_web(
    query: str,
    recency: str | None = None,
    domain_filter: str | None = None,
    max_results: int = 5,
) -> list[dict[str, Any]]:
    """
    Search the web for current information.

    In Phase 7, this will use Gemini's search grounding or Google Search API.
    Returns empty list in current phase — integrated with Evidence model.
    """
    start = time.monotonic()
    latency_ms = int((time.monotonic() - start) * 1000)

    logger.info(
        "Web search (stub)",
        query=query,
        recency=recency,
        latency_ms=latency_ms,
    )

    # When GEMINI_API_KEY is available, Gemini's search grounding
    # can be used via the generate_structured function with search tool enabled.
    # For now, return empty list to avoid blocking plan generation.
    return []
