"""
Plan repository — database access for Plan, PlanSection, and related queries.
"""

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from lifeos.db.models.plan import Plan
from lifeos.db.models.plan_section import PlanSection
from lifeos.db.models.task import Task


class PlanRepository:
    """Database access layer for Plan and PlanSection."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create_plan(self, activity_id: uuid.UUID, data: dict[str, Any]) -> Plan:
        plan = Plan(activity_id=activity_id, **data)
        self._db.add(plan)
        await self._db.flush()
        await self._db.refresh(plan)
        return plan

    async def get_plan_by_id(self, plan_id: uuid.UUID) -> Plan | None:
        stmt = select(Plan).where(Plan.id == plan_id)
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_plan_with_sections(self, plan_id: uuid.UUID) -> Plan | None:
        """Load plan with sections (no tasks — use separate query for tasks)."""
        stmt = (
            select(Plan)
            .where(Plan.id == plan_id)
            .options(selectinload(Plan.sections))
        )
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_plans_for_activity(self, activity_id: uuid.UUID) -> list[Plan]:
        stmt = (
            select(Plan)
            .where(Plan.activity_id == activity_id)
            .order_by(Plan.version.desc())
        )
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def update_plan_status(self, plan: Plan, status: str) -> Plan:
        plan.status = status
        await self._db.flush()
        return plan

    async def create_section(
        self, plan_id: uuid.UUID, data: dict[str, Any]
    ) -> PlanSection:
        section = PlanSection(plan_id=plan_id, **data)
        self._db.add(section)
        await self._db.flush()
        await self._db.refresh(section)
        return section

    async def get_sections_for_plan(self, plan_id: uuid.UUID) -> list[PlanSection]:
        stmt = (
            select(PlanSection)
            .where(PlanSection.plan_id == plan_id)
            .order_by(PlanSection.order_index)
        )
        result = await self._db.execute(stmt)
        return list(result.scalars().all())
