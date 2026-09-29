"""PlanPlace join table — N:M association between Plan and Place."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from lifeos.db.base import Base


class PlanPlace(Base):
    """
    Resolves the N:M relationship between Plan and Place.

    role captures the contextual purpose of the place within the plan,
    e.g. 'destination', 'food', 'fuel', 'rest', 'attraction'.
    """

    __tablename__ = "plan_places"
    __table_args__ = (
        UniqueConstraint("plan_id", "place_id", name="uq_plan_place"),
        Index("ix_plan_places_plan_id", "plan_id"),
        Index("ix_plan_places_place_id", "place_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("plans.id", ondelete="CASCADE"),
        nullable=False,
    )
    place_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("places.id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[str | None] = mapped_column(String(64), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    plan: Mapped["Plan"] = relationship("Plan", back_populates="plan_places")
    place: Mapped["Place"] = relationship("Place", back_populates="plan_places")

    def __repr__(self) -> str:
        return f"<PlanPlace plan={self.plan_id} place={self.place_id} role={self.role!r}>"
