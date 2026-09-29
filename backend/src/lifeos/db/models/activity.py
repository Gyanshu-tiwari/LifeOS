"""Activity model — the user's original real-world intention."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from lifeos.db.base import Base


class Activity(Base):
    """
    Stable source context for a user's intention.

    A single Activity may produce multiple Plans (one per generation run).
    The raw_intent field preserves the user's original wording.
    """

    __tablename__ = "activities"
    __table_args__ = (
        Index("ix_activities_user_id", "user_id"),
        Index("ix_activities_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    raw_intent: Mapped[str] = mapped_column(Text, nullable=False)
    activity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="DRAFT"
    )

    # Optional time window
    start_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    end_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Location context
    origin_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    destination_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    travel_mode: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # Flexible AI-generated constraints and preferences
    constraints_json: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True
    )

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
    user: Mapped["User"] = relationship("User", back_populates="activities")
    plans: Mapped[list["Plan"]] = relationship(
        "Plan", back_populates="activity", cascade="all, delete-orphan"
    )
    plan_runs: Mapped[list["PlanRun"]] = relationship(
        "PlanRun", back_populates="activity", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Activity id={self.id} title={self.title!r} status={self.status}>"
