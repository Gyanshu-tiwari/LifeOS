"""ToolCall model — traceability record for every external provider call."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from lifeos.db.base import Base


class ToolCall(Base):
    """
    Records every external provider call made during a PlanRun.

    Status values: STARTED | SUCCEEDED | FAILED | TIMEOUT
    Enables debugging, cost analysis and reliability monitoring.
    """

    __tablename__ = "tool_calls"
    __table_args__ = (
        Index("ix_tool_calls_plan_run_id", "plan_run_id"),
        Index("ix_tool_calls_status", "status"),
        Index("ix_tool_calls_tool_name", "tool_name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    plan_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("plan_runs.id", ondelete="CASCADE"),
        nullable=False,
    )
    tool_name: Mapped[str] = mapped_column(String(128), nullable=False)
    provider: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="STARTED"
    )
    request_hash: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )  # for deduplication
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    response_summary_json: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True
    )
    error_code: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Relationships
    plan_run: Mapped["PlanRun"] = relationship(
        "PlanRun", back_populates="tool_calls"
    )

    def __repr__(self) -> str:
        return f"<ToolCall id={self.id} tool={self.tool_name!r} status={self.status}>"
