"""RouteStop model — ordered checkpoint on a Route."""

import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from lifeos.db.base import Base


class RouteStop(Base):
    """
    An ordered stop along a Route.

    place_id is optional — generic checkpoints (e.g. 'rest area') may not
    have a resolved Place record.
    order_index is unique per route.
    """

    __tablename__ = "route_stops"
    __table_args__ = (
        UniqueConstraint("route_id", "order_index", name="uq_route_stop_order"),
        Index("ix_route_stops_route_id", "route_id"),
        Index("ix_route_stops_place_id", "place_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    route_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("routes.id", ondelete="CASCADE"),
        nullable=False,
    )
    place_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("places.id", ondelete="SET NULL"),
        nullable=True,
    )
    label: Mapped[str | None] = mapped_column(String(256), nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    detour_minutes: Mapped[float | None] = mapped_column(Float, nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    arrival_estimate: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Relationships
    route: Mapped["Route"] = relationship("Route", back_populates="stops")
    place: Mapped["Place | None"] = relationship(
        "Place", back_populates="route_stops"
    )

    def __repr__(self) -> str:
        return f"<RouteStop id={self.id} order={self.order_index} label={self.label!r}>"
