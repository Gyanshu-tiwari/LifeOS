"""PlanRun model — generation execution record and state machine."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from lifeos.db.base import Base


class PlanRun(Base):
    """
    Records a single plan-generation execution.

    PlanRun.plan_id references the Plan produced by this run.
    This FK is added *after* both tables exist to avoid circular dependency
    at migration time (handled via ALTER TABLE in the migration script).

    Status values: QUEUED | RUNNING | SUCCEEDED | FAILED | CANCELLED | SUPERSEDED
    """

    __tablename__ = "plan_runs"
    __table_args__ = (
        Index("ix_plan_runs_activity_id", "activity_id"),
        Index("ix_plan_runs_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    activity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("activities.id", ondelete="CASCADE"),
        nullable=False,
    )
    # plan_id is nullable: set once plan is generated.
    # The FK constraint is added post-table-creation in migration.
    plan_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="QUEUED"
    )
    model: Mapped[str | None] = mapped_column(String(128), nullable=True)
    prompt_version: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )
    idempotency_key: Mapped[str | None] = mapped_column(
        String(256), nullable=True, unique=True, index=True
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    error_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    metrics_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    activity: Mapped["Activity"] = relationship(
        "Activity", back_populates="plan_runs"
    )
    tool_calls: Mapped[list["ToolCall"]] = relationship(
        "ToolCall", back_populates="plan_run", cascade="all, delete-orphan"
    )
    evidence: Mapped[list["Evidence"]] = relationship(
        "Evidence", back_populates="plan_run", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<PlanRun id={self.id} status={self.status}>"
