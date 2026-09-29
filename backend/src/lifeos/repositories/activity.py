"""
Activity repository — all database access for the Activity entity.

No business logic here; that belongs in ActivityService.
"""

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from lifeos.db.models.activity import Activity


class ActivityRepository:
    """Database access layer for Activity."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(self, user_id: uuid.UUID, data: dict[str, Any]) -> Activity:
        """Insert a new Activity and return it."""
        activity = Activity(user_id=user_id, **data)
        self._db.add(activity)
        await self._db.flush()  # get the generated id without committing
        await self._db.refresh(activity)
        return activity

    async def get_by_id(self, activity_id: uuid.UUID) -> Activity | None:
        """Fetch a single Activity by primary key."""
        stmt = select(Activity).where(Activity.id == activity_id)
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id_and_user(
        self, activity_id: uuid.UUID, user_id: uuid.UUID
    ) -> Activity | None:
        """Fetch a single Activity that belongs to the given user."""
        stmt = select(Activity).where(
            Activity.id == activity_id,
            Activity.user_id == user_id,
        )
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        limit: int = 20,
        offset: int = 0,
        status_filter: str | None = None,
    ) -> tuple[list[Activity], int]:
        """
        Return a page of Activities for a user plus the total count.
        """
        base = select(Activity).where(Activity.user_id == user_id)
        count_query = select(func.count()).select_from(
            Activity
        ).where(Activity.user_id == user_id)

        if status_filter:
            base = base.where(Activity.status == status_filter)
            count_query = count_query.where(Activity.status == status_filter)

        total_result = await self._db.execute(count_query)
        total = total_result.scalar_one()

        items_result = await self._db.execute(
            base.order_by(Activity.created_at.desc()).limit(limit).offset(offset)
        )
        items = list(items_result.scalars().all())
        return items, total

    async def update(
        self, activity: Activity, updates: dict[str, Any]
    ) -> Activity:
        """Apply a dict of field updates to an Activity."""
        for field, value in updates.items():
            setattr(activity, field, value)
        await self._db.flush()
        await self._db.refresh(activity)
        return activity
