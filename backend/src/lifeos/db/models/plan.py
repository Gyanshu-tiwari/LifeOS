"""Plan model — a generated actionable plan snapshot tied to an Activity."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from lifeos.db.base import Base


class Plan(Base):
    """
    A single generated plan snapshot for an Activity.

    Multiple Plans may exist per Activity (one per generation run).
    Regeneration creates a new Plan rather than overwriting an existing one.

    created_from_run_id: references the PlanRun that produced this plan.
    This creates a circular FK with PlanRun.plan_id. Both are nullable and
    the PlanRun.plan_id FK is added via ALTER TABLE in the migration to avoid
    a circular dependency at DDL time.

    Status values: GENERATING | READY | FAILED | ARCHIVED
    """

    __tablename__ = "plans"
    __table_args__ = (
        Index("ix_plans_activity_id", "activity_id"),
        Index("ix_plans_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    activity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("activities.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="GENERATING"
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Provenance: which run generated this plan
    # FK to plan_runs added via ALTER TABLE in migration (circular resolution)
    created_from_run_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
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
    activity: Mapped["Activity"] = relationship(
        "Activity", back_populates="plans"
    )
    sections: Mapped[list["PlanSection"]] = relationship(
        "PlanSection",
        back_populates="plan",
        cascade="all, delete-orphan",
        order_by="PlanSection.order_index",
    )
    plan_places: Mapped[list["PlanPlace"]] = relationship(
        "PlanPlace", back_populates="plan", cascade="all, delete-orphan"
    )
    routes: Mapped[list["Route"]] = relationship(
        "Route", back_populates="plan", cascade="all, delete-orphan"
    )
    packing_items: Mapped[list["PackingItem"]] = relationship(
        "PackingItem", back_populates="plan", cascade="all, delete-orphan"
    )
    itinerary_items: Mapped[list["ItineraryItem"]] = relationship(
        "ItineraryItem",
        back_populates="plan",
        cascade="all, delete-orphan",
        order_by="ItineraryItem.order_index",
    )

    def __repr__(self) -> str:
        return f"<Plan id={self.id} title={self.title!r} status={self.status}>"
