"""
Evidence service — records grounded claims and sources for plan runs.

Implements the trust hierarchy from the dossier:
  1. user_fact     — directly provided by the user
  2. provider      — Maps/Places structured data
  3. search        — current web search results
  4. inference     — model reasoning
  5. unknown       — source unclear
"""

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from lifeos.core.logging import get_logger
from lifeos.db.models.evidence import Evidence

logger = get_logger(__name__)

VALID_SOURCE_TYPES = {"user_fact", "provider", "search", "inference", "unknown"}
VALID_RELEVANCE = {"high", "medium", "low"}


class EvidenceService:
    """Records traceable claims for a plan run."""

    def __init__(self, db: AsyncSession, plan_run_id: uuid.UUID) -> None:
        self._db = db
        self._plan_run_id = plan_run_id

    async def record(
        self,
        source_type: str,
        claim: str | None = None,
        source_uri: str | None = None,
        title: str | None = None,
        relevance: str = "medium",
        metadata: dict[str, Any] | None = None,
    ) -> Evidence:
        """
        Record a single evidence item.

        source_type must be one of the trust hierarchy levels.
        """
        if source_type not in VALID_SOURCE_TYPES:
            logger.warning(
                "Unknown evidence source_type — defaulting to 'unknown'",
                source_type=source_type,
            )
            source_type = "unknown"

        if relevance not in VALID_RELEVANCE:
            relevance = "medium"

        evidence = Evidence(
            plan_run_id=self._plan_run_id,
            source_type=source_type,
            source_uri=source_uri,
            title=title,
            retrieved_at=datetime.now(tz=timezone.utc),
            claim=claim,
            relevance=relevance,
            metadata_json=metadata,
        )
        self._db.add(evidence)
        await self._db.flush()

        logger.info(
            "Evidence recorded",
            source_type=source_type,
            relevance=relevance,
            claim_preview=claim[:60] if claim else None,
        )
        return evidence

    async def record_user_fact(self, claim: str, metadata: dict | None = None) -> Evidence:
        return await self.record("user_fact", claim=claim, relevance="high", metadata=metadata)

    async def record_provider(
        self, claim: str, source_uri: str | None, title: str | None = None,
        relevance: str = "high"
    ) -> Evidence:
        return await self.record(
            "provider", claim=claim, source_uri=source_uri, title=title, relevance=relevance
        )

    async def record_search(
        self, claim: str, source_uri: str, title: str | None = None, relevance: str = "medium"
    ) -> Evidence:
        return await self.record(
            "search", claim=claim, source_uri=source_uri, title=title, relevance=relevance
        )

    async def record_inference(self, claim: str, relevance: str = "low") -> Evidence:
        return await self.record("inference", claim=claim, relevance=relevance)
