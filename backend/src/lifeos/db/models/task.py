"""Task and TaskDependency models — actionable work items with dependency graph."""

import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
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


class Task(Base):
    """
    An actionable item within a PlanSection.

    Supports:
    - Subtasks via parent_task_id (self-referential 1:N)
    - Dependencies via TaskDependency (N:M self-referential)
    - Priority: ESSENTIAL | HIGH | MEDIUM | LOW
    - Status: TODO | IN_PROGRESS | COMPLETED | BLOCKED | CANCELLED
    """

    __tablename__ = "tasks"
    __table_args__ = (
        Index("ix_tasks_plan_section_id", "plan_section_id"),
        Index("ix_tasks_parent_task_id", "parent_task_id"),
        Index("ix_tasks_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    plan_section_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("plan_sections.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Nullable for top-level tasks
    parent_task_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=True,
    )

    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="TODO"
    )
    priority: Mapped[str] = mapped_column(
        String(32), nullable=False, default="MEDIUM"
    )
    due_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    estimated_minutes: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    source: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )  # ai_generated | user_created | imported
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
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
    section: Mapped["PlanSection"] = relationship(
        "PlanSection",
        back_populates="tasks",
        foreign_keys=[plan_section_id],
    )
    parent: Mapped["Task | None"] = relationship(
        "Task",
        back_populates="subtasks",
        foreign_keys=[parent_task_id],
        remote_side="Task.id",
    )
    subtasks: Mapped[list["Task"]] = relationship(
        "Task",
        back_populates="parent",
        foreign_keys=[parent_task_id],
        cascade="all, delete-orphan",
    )
    # Outgoing dependencies: tasks this task depends on
    dependencies: Mapped[list["TaskDependency"]] = relationship(
        "TaskDependency",
        foreign_keys="TaskDependency.task_id",
        back_populates="task",
        cascade="all, delete-orphan",
    )
    # Incoming dependents: tasks that depend on this task
    dependents: Mapped[list["TaskDependency"]] = relationship(
        "TaskDependency",
        foreign_keys="TaskDependency.depends_on_id",
        back_populates="depends_on_task",
    )

    def __repr__(self) -> str:
        return f"<Task id={self.id} title={self.title!r} status={self.status}>"


class TaskDependency(Base):
    """
    N:M self-referential dependency between Tasks.

    Invariants enforced in the service layer:
    - No self-loop (task_id != depends_on_id)
    - No dependency cycles
    """

    __tablename__ = "task_dependencies"
    __table_args__ = (
        UniqueConstraint(
            "task_id", "depends_on_id", name="uq_task_dependency_pair"
        ),
        CheckConstraint(
            "task_id != depends_on_id", name="ck_no_self_dependency"
        ),
        Index("ix_task_dependencies_task_id", "task_id"),
        Index("ix_task_dependencies_depends_on_id", "depends_on_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
    )
    depends_on_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
    )

    task: Mapped["Task"] = relationship(
        "Task",
        foreign_keys=[task_id],
        back_populates="dependencies",
    )
    depends_on_task: Mapped["Task"] = relationship(
        "Task",
        foreign_keys=[depends_on_id],
        back_populates="dependents",
    )

    def __repr__(self) -> str:
        return f"<TaskDependency task={self.task_id} depends_on={self.depends_on_id}>"
