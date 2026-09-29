"""Evidence model — source/claim record for grounding and trust layer."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from lifeos.db.base import Base


class Evidence(Base):
    """
    Records a traceable claim with its source, supporting the trust hierarchy:
    1. User-provided facts
    2. Structured provider data (Maps/Places)
    3. Current search-grounded sources
    4. Model inference
    5. Unknown

    source_type: user_fact | provider | search | inference | unknown
    """

    __tablename__ = "evidence"
    __table_args__ = (
        Index("ix_evidence_plan_run_id", "plan_run_id"),
        Index("ix_evidence_source_type", "source_type"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    plan_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("plan_runs.id", ondelete="CASCADE"),
        nullable=False,
    )
    source_type: Mapped[str] = mapped_column(
        String(32), nullable=False
    )  # user_fact | provider | search | inference | unknown
    source_uri: Mapped[str | None] = mapped_column(Text, nullable=True)
    title: Mapped[str | None] = mapped_column(String(512), nullable=True)
    retrieved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    claim: Mapped[str | None] = mapped_column(Text, nullable=True)
    relevance: Mapped[str | None] = mapped_column(
        String(32), nullable=True
    )  # high | medium | low
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    plan_run: Mapped["PlanRun"] = relationship(
        "PlanRun", back_populates="evidence"
    )

    def __repr__(self) -> str:
        return f"<Evidence id={self.id} source_type={self.source_type!r} claim={self.claim!r:.40}>"
