"""
PlanService — business logic for Plan lifecycle and progress.
"""

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from lifeos.core.exceptions import AuthorizationError, NotFoundError
from lifeos.core.logging import get_logger
from lifeos.db.models.plan import Plan
from lifeos.repositories.activity import ActivityRepository
from lifeos.repositories.plan import PlanRepository
from lifeos.repositories.task import TaskRepository
from lifeos.repositories.user import UserRepository
from lifeos.schemas.plan import (
    NextActionResponse,
    PlanProgressResponse,
    TaskResponse,
)
from lifeos.services.task_service import TaskService

logger = get_logger(__name__)


class PlanService:
    """Application service for Plan operations."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._plan_repo = PlanRepository(db)
        self._task_repo = TaskRepository(db)
        self._activity_repo = ActivityRepository(db)
        self._user_repo = UserRepository(db)
        self._task_svc = TaskService(db)

    async def _assert_plan_ownership(
        self, plan_id: uuid.UUID, user_id: uuid.UUID
    ) -> Plan:
        """Verify plan exists and belongs to user's activity."""
        plan = await self._plan_repo.get_plan_by_id(plan_id)
        if plan is None:
            raise NotFoundError(f"Plan {plan_id} not found", code="PLAN_NOT_FOUND")

        activity = await self._activity_repo.get_by_id_and_user(
            plan.activity_id, user_id
        )
        if activity is None:
            raise AuthorizationError(
                "You do not have access to this plan",
                code="PLAN_ACCESS_DENIED",
            )
        return plan

    async def get_plan(self, plan_id: uuid.UUID, user_id: uuid.UUID) -> Plan:
        return await self._assert_plan_ownership(plan_id, user_id)

    async def get_plans_for_activity(
        self, activity_id: uuid.UUID, user_id: uuid.UUID
    ) -> list[Plan]:
        activity = await self._activity_repo.get_by_id_and_user(
            activity_id, user_id
        )
        if activity is None:
            raise NotFoundError(
                f"Activity {activity_id} not found", code="ACTIVITY_NOT_FOUND"
            )
        return await self._plan_repo.get_plans_for_activity(activity_id)

    async def get_plan_progress(
        self, plan_id: uuid.UUID, user_id: uuid.UUID
    ) -> PlanProgressResponse:
        plan = await self._assert_plan_ownership(plan_id, user_id)
        sections = await self._plan_repo.get_sections_for_plan(plan_id)
        section_ids = [s.id for s in sections]

        status_counts = await self._task_repo.count_tasks_by_status(section_ids)
        total = sum(status_counts.values())
        completed = status_counts.get("COMPLETED", 0)
        in_progress = status_counts.get("IN_PROGRESS", 0)
        blocked = status_counts.get("BLOCKED", 0)

        return PlanProgressResponse(
            plan_id=plan_id,
            total_tasks=total,
            completed_tasks=completed,
            in_progress_tasks=in_progress,
            blocked_tasks=blocked,
            completion_percent=round((completed / total * 100), 1) if total > 0 else 0.0,
        )

    async def get_next_action(
        self, plan_id: uuid.UUID, user_id: uuid.UUID
    ) -> NextActionResponse:
        plan = await self._assert_plan_ownership(plan_id, user_id)
        sections = await self._plan_repo.get_sections_for_plan(plan_id)
        section_ids = [s.id for s in sections]

        next_task = await self._task_svc.compute_next_action(section_ids)

        if next_task is None:
            progress = await self.get_plan_progress(plan_id, user_id)
            if progress.total_tasks == 0:
                message = "No tasks have been created yet"
            elif progress.completion_percent == 100:
                message = "All tasks are completed — plan is done!"
            else:
                message = "No actionable tasks available — check for blocked tasks"
        else:
            message = f"Next: {next_task.title}"

        return NextActionResponse(
            plan_id=plan_id,
            task=TaskResponse.model_validate(next_task) if next_task else None,
            message=message,
        )
