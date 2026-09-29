"""
TaskService — business logic for tasks, subtasks, and dependency graph.

Critical invariants enforced here (not by DB alone):
1. No self-dependencies (also enforced by DB CHECK constraint)
2. No dependency cycles (topological sort validation)
3. Status transition rules
"""

import uuid
from collections import deque
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from lifeos.core.exceptions import ConflictError, NotFoundError, ValidationError
from lifeos.core.logging import get_logger
from lifeos.db.models.task import Task
from lifeos.repositories.plan import PlanRepository
from lifeos.repositories.task import TaskRepository
from lifeos.schemas.plan import TaskCreate, TaskUpdate

logger = get_logger(__name__)

VALID_STATUSES = {"TODO", "IN_PROGRESS", "COMPLETED", "BLOCKED", "CANCELLED"}
VALID_PRIORITIES = {"ESSENTIAL", "HIGH", "MEDIUM", "LOW"}


class TaskService:
    """Application service for Task operations."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._task_repo = TaskRepository(db)
        self._plan_repo = PlanRepository(db)

    async def create_task(self, payload: TaskCreate) -> Task:
        """
        Create a task. Validates section existence and optional parent.
        """
        if payload.priority.upper() not in VALID_PRIORITIES:
            raise ValidationError(
                f"priority must be one of {VALID_PRIORITIES}",
                code="INVALID_PRIORITY",
            )

        # Validate parent task exists and belongs to same section
        if payload.parent_task_id:
            parent = await self._task_repo.get_task_by_id(payload.parent_task_id)
            if parent is None:
                raise NotFoundError(
                    f"Parent task {payload.parent_task_id} not found",
                    code="PARENT_TASK_NOT_FOUND",
                )
            if parent.plan_section_id != payload.plan_section_id:
                raise ValidationError(
                    "Parent task must belong to the same plan section",
                    code="PARENT_SECTION_MISMATCH",
                )

        data = payload.model_dump(exclude_unset=False)
        task = await self._task_repo.create_task(data)
        # commit handled by get_db dependency

        logger.info("Task created", task_id=str(task.id), title=task.title)
        return task

    async def get_task(self, task_id: uuid.UUID) -> Task:
        task = await self._task_repo.get_task_by_id(task_id)
        if task is None:
            raise NotFoundError(f"Task {task_id} not found", code="TASK_NOT_FOUND")
        return task

    async def update_task(self, task_id: uuid.UUID, payload: TaskUpdate) -> Task:
        task = await self.get_task(task_id)

        updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}

        if "status" in updates:
            s = updates["status"].upper()
            if s not in VALID_STATUSES:
                raise ValidationError(f"status must be one of {VALID_STATUSES}")
            updates["status"] = s

        if "priority" in updates:
            p = updates["priority"].upper()
            if p not in VALID_PRIORITIES:
                raise ValidationError(f"priority must be one of {VALID_PRIORITIES}")
            updates["priority"] = p

        if not updates:
            return task

        task = await self._task_repo.update_task(task, updates)
        # commit handled by get_db dependency
        return task

    async def complete_task(self, task_id: uuid.UUID) -> Task:
        """Mark a task COMPLETED and set completed_at."""
        task = await self.get_task(task_id)
        if task.status == "COMPLETED":
            return task  # idempotent

        updates = {
            "status": "COMPLETED",
            "completed_at": datetime.now(tz=timezone.utc),
        }
        task = await self._task_repo.update_task(task, updates)
        # commit handled by get_db dependency
        logger.info("Task completed", task_id=str(task_id))
        return task

    async def reopen_task(self, task_id: uuid.UUID) -> Task:
        """Reopen a COMPLETED or CANCELLED task back to TODO."""
        task = await self.get_task(task_id)
        updates = {"status": "TODO", "completed_at": None}
        task = await self._task_repo.update_task(task, updates)
        # commit handled by get_db dependency
        return task

    async def add_dependency(
        self, task_id: uuid.UUID, depends_on_id: uuid.UUID
    ) -> None:
        """
        Add a dependency edge: task_id depends on depends_on_id.

        Validates:
        - Self-dependency check (also enforced by DB)
        - Cycle detection via BFS
        """
        if task_id == depends_on_id:
            raise ValidationError(
                "A task cannot depend on itself",
                code="SELF_DEPENDENCY",
            )

        # Check both tasks exist
        task = await self._task_repo.get_task_by_id(task_id)
        depends_on = await self._task_repo.get_task_by_id(depends_on_id)
        if task is None:
            raise NotFoundError(f"Task {task_id} not found")
        if depends_on is None:
            raise NotFoundError(f"Task {depends_on_id} not found")

        # Cycle detection: would adding task→depends_on create a cycle?
        # i.e., can we reach task_id starting from depends_on_id?
        if await self._would_create_cycle(task_id, depends_on_id):
            raise ValidationError(
                "Adding this dependency would create a cycle",
                code="DEPENDENCY_CYCLE",
            )

        try:
            await self._task_repo.create_dependency(task_id, depends_on_id)
            # commit handled by get_db dependency
        except Exception:
            raise ConflictError(
                "Dependency already exists",
                code="DEPENDENCY_EXISTS",
            )

    async def remove_dependency(
        self, task_id: uuid.UUID, depends_on_id: uuid.UUID
    ) -> None:
        removed = await self._task_repo.delete_dependency(task_id, depends_on_id)
        if not removed:
            raise NotFoundError("Dependency not found", code="DEPENDENCY_NOT_FOUND")
        # commit handled by get_db dependency

    async def _would_create_cycle(
        self, task_id: uuid.UUID, new_depends_on: uuid.UUID
    ) -> bool:
        """
        BFS from new_depends_on through existing depends_on edges.
        If we reach task_id, adding this edge would create a cycle.
        """
        visited: set[uuid.UUID] = set()
        queue: deque[uuid.UUID] = deque([new_depends_on])

        while queue:
            current = queue.popleft()
            if current == task_id:
                return True
            if current in visited:
                continue
            visited.add(current)

            # Find what current depends on (outgoing from current's perspective)
            deps = await self._task_repo.get_dependencies_for_task(current)
            for dep in deps:
                if dep.depends_on_id not in visited:
                    queue.append(dep.depends_on_id)

        return False

    async def compute_next_action(
        self, section_ids: list[uuid.UUID]
    ) -> Task | None:
        """
        Determine the next actionable task across a plan's sections.

        A task is actionable if:
        - Status is TODO or IN_PROGRESS
        - All its dependencies are COMPLETED
        - Sorted by priority (ESSENTIAL > HIGH > MEDIUM > LOW), then created_at
        """
        all_tasks = await self._task_repo.get_tasks_for_plan_sections(section_ids)
        all_deps = await self._task_repo.get_all_dependencies_for_sections(
            [t.id for t in all_tasks]
        )

        # Build a map: task_id → set of depends_on_id
        dep_map: dict[uuid.UUID, set[uuid.UUID]] = {}
        for dep in all_deps:
            dep_map.setdefault(dep.task_id, set()).add(dep.depends_on_id)

        completed_ids = {t.id for t in all_tasks if t.status == "COMPLETED"}

        priority_order = {"ESSENTIAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}

        candidates = []
        for task in all_tasks:
            if task.status not in ("TODO", "IN_PROGRESS"):
                continue
            deps = dep_map.get(task.id, set())
            if deps.issubset(completed_ids):
                candidates.append(task)

        if not candidates:
            return None

        candidates.sort(
            key=lambda t: (priority_order.get(t.priority, 99), t.created_at)
        )
        return candidates[0]
