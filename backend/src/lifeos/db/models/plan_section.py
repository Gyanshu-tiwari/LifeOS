"""PlanSection model — logical section within a generated Plan."""

import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from lifeos.db.base import Base


class PlanSection(Base):
    """
    A named logical group within a Plan (e.g. 'Before You Leave', 'Journey').

    order_index within a plan must be unique.
    """

    __tablename__ = "plan_sections"
    __table_args__ = (
        UniqueConstraint("plan_id", "order_index", name="uq_plan_section_order"),
        Index("ix_plan_sections_plan_id", "plan_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("plans.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    section_type: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )  # e.g. preparation, journey, destination, general
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

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
    plan: Mapped["Plan"] = relationship("Plan", back_populates="sections")
    tasks: Mapped[list["Task"]] = relationship(
        "Task",
        back_populates="section",
        cascade="all, delete-orphan",
        foreign_keys="Task.plan_section_id",
    )

    def __repr__(self) -> str:
        return f"<PlanSection id={self.id} title={self.title!r} order={self.order_index}>"
