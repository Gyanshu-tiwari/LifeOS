"""Route model — a calculated journey snapshot attached to a Plan."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from lifeos.db.base import Base


class Route(Base):
    """
    Stores a route snapshot for a Plan, sourced from the Routes API.

    polyline: encoded polyline for the route path.
    """

    __tablename__ = "routes"
    __table_args__ = (
        Index("ix_routes_plan_id", "plan_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("plans.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider: Mapped[str] = mapped_column(
        String(64), nullable=False, default="google"
    )
    travel_mode: Mapped[str | None] = mapped_column(String(32), nullable=True)
    origin_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    destination_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    distance_meters: Mapped[int | None] = mapped_column(Integer, nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    polyline: Mapped[str | None] = mapped_column(Text, nullable=True)
    route_metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

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
    plan: Mapped["Plan"] = relationship("Plan", back_populates="routes")
    stops: Mapped[list["RouteStop"]] = relationship(
        "RouteStop",
        back_populates="route",
        cascade="all, delete-orphan",
        order_by="RouteStop.order_index",
    )

    def __repr__(self) -> str:
        return f"<Route id={self.id} mode={self.travel_mode}>"
