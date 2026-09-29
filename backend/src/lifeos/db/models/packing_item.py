"""PackingItem model — priority-aware item to carry for a Plan."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from lifeos.db.base import Base


class PackingItem(Base):
    """
    An item the user should pack or prepare for a Plan.

    priority: ESSENTIAL | RECOMMENDED | OPTIONAL
    checked_at: set when the user marks the item as packed.
    """

    __tablename__ = "packing_items"
    __table_args__ = (
        Index("ix_packing_items_plan_id", "plan_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("plans.id", ondelete="CASCADE"),
        nullable=False,
    )
    item: Mapped[str] = mapped_column(String(256), nullable=False)
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    priority: Mapped[str] = mapped_column(
        String(32), nullable=False, default="RECOMMENDED"
    )
    quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    checked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    plan: Mapped["Plan"] = relationship("Plan", back_populates="packing_items")

    def __repr__(self) -> str:
        return f"<PackingItem id={self.id} item={self.item!r} priority={self.priority}>"
