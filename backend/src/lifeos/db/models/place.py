"""Place model — normalized external place record from a provider."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, Index, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from lifeos.db.base import Base


class Place(Base):
    """
    Stores a normalized place record sourced from an external provider
    (e.g. Google Places API New).

    provider_place_id is the provider's canonical identifier.
    It should NOT be used as the LIFEOS internal PK.
    """

    __tablename__ = "places"
    __table_args__ = (
        Index("ix_places_provider_place_id", "provider_place_id"),
        Index("ix_places_provider", "provider"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    provider: Mapped[str] = mapped_column(
        String(64), nullable=False, default="google"
    )
    provider_place_id: Mapped[str | None] = mapped_column(
        String(512), nullable=True
    )
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    formatted_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    primary_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    types_json: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    website_uri: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    opening_hours_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    photo_refs_json: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    raw_metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

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
    plan_places: Mapped[list["PlanPlace"]] = relationship(
        "PlanPlace", back_populates="place"
    )
    route_stops: Mapped[list["RouteStop"]] = relationship(
        "RouteStop", back_populates="place"
    )
    itinerary_items: Mapped[list["ItineraryItem"]] = relationship(
        "ItineraryItem", back_populates="place"
    )

    def __repr__(self) -> str:
        return f"<Place id={self.id} name={self.name!r}>"
