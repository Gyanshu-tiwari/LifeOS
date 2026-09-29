"""PlanRun repository — database access for PlanRun records."""

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from lifeos.db.models.plan_run import PlanRun


class PlanRunRepository:
    """Database access layer for PlanRun."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, run_id: uuid.UUID) -> PlanRun | None:
        stmt = select(PlanRun).where(PlanRun.id == run_id)
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_idempotency_key(self, key: str) -> PlanRun | None:
        stmt = select(PlanRun).where(PlanRun.idempotency_key == key)
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_for_activity(self, activity_id: uuid.UUID) -> list[PlanRun]:
        stmt = (
            select(PlanRun)
            .where(PlanRun.activity_id == activity_id)
            .order_by(PlanRun.created_at.desc())
        )
        result = await self._db.execute(stmt)
        return list(result.scalars().all())
