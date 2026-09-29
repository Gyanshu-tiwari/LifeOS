"""
Task repository — database access for Task and TaskDependency.
"""

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from lifeos.db.models.task import Task, TaskDependency


class TaskRepository:
    """Database access layer for Task and TaskDependency."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create_task(self, data: dict[str, Any]) -> Task:
        task = Task(**data)
        self._db.add(task)
        await self._db.flush()
        await self._db.refresh(task)
        return task

    async def get_task_by_id(self, task_id: uuid.UUID) -> Task | None:
        stmt = select(Task).where(Task.id == task_id)
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_tasks_for_section(
        self, plan_section_id: uuid.UUID, top_level_only: bool = False
    ) -> list[Task]:
        """Get tasks for a section; optionally only top-level (no parent)."""
        stmt = select(Task).where(Task.plan_section_id == plan_section_id)
        if top_level_only:
            stmt = stmt.where(Task.parent_task_id.is_(None))
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def get_tasks_for_plan_sections(
        self, section_ids: list[uuid.UUID]
    ) -> list[Task]:
        """Get all tasks across multiple sections."""
        if not section_ids:
            return []
        stmt = select(Task).where(Task.plan_section_id.in_(section_ids))
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def update_task(
        self, task: Task, updates: dict[str, Any]
    ) -> Task:
        for field, value in updates.items():
            setattr(task, field, value)
        await self._db.flush()
        await self._db.refresh(task)
        return task

    async def count_tasks_by_status(
        self, section_ids: list[uuid.UUID]
    ) -> dict[str, int]:
        """Return status → count map for tasks across given sections."""
        if not section_ids:
            return {}
        stmt = (
            select(Task.status, func.count(Task.id))
            .where(Task.plan_section_id.in_(section_ids))
            .group_by(Task.status)
        )
        result = await self._db.execute(stmt)
        return {row[0]: row[1] for row in result.all()}

    async def get_dependencies_for_task(
        self, task_id: uuid.UUID
    ) -> list[TaskDependency]:
        stmt = select(TaskDependency).where(TaskDependency.task_id == task_id)
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def get_all_dependencies_for_sections(
        self, task_ids: list[uuid.UUID]
    ) -> list[TaskDependency]:
        """Return all dependency edges for a set of task IDs."""
        if not task_ids:
            return []
        stmt = select(TaskDependency).where(
            TaskDependency.task_id.in_(task_ids)
        )
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def create_dependency(
        self, task_id: uuid.UUID, depends_on_id: uuid.UUID
    ) -> TaskDependency:
        dep = TaskDependency(task_id=task_id, depends_on_id=depends_on_id)
        self._db.add(dep)
        await self._db.flush()
        return dep

    async def delete_dependency(
        self, task_id: uuid.UUID, depends_on_id: uuid.UUID
    ) -> bool:
        stmt = select(TaskDependency).where(
            TaskDependency.task_id == task_id,
            TaskDependency.depends_on_id == depends_on_id,
        )
        result = await self._db.execute(stmt)
        dep = result.scalar_one_or_none()
        if dep is None:
            return False
        await self._db.delete(dep)
        await self._db.flush()
        return True
