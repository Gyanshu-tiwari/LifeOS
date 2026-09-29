"""
Place repository — database access for Place and PlanPlace records.

Places are deduped by provider + provider_place_id.
"""

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from lifeos.db.models.place import Place
from lifeos.db.models.plan_place import PlanPlace


class PlaceRepository:
    """Database access for Place (global cache) and PlanPlace (plan-specific)."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_provider_id(
        self, provider: str, provider_place_id: str
    ) -> Place | None:
        stmt = select(Place).where(
            Place.provider == provider,
            Place.provider_place_id == provider_place_id,
        )
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert_place(self, data: dict[str, Any]) -> Place:
        """
        Insert or update a place record.

        Uses provider + provider_place_id as the natural key.
        If the place already exists, updates it with fresh provider data.
        """
        existing = await self.get_by_provider_id(
            provider=data["provider"],
            provider_place_id=data["provider_place_id"],
        )
        if existing:
            for field, value in data.items():
                if hasattr(existing, field) and value is not None:
                    setattr(existing, field, value)
            await self._db.flush()
            return existing

        place = Place(**{k: v for k, v in data.items() if hasattr(Place, k)})
        self._db.add(place)
        await self._db.flush()
        await self._db.refresh(place)
        return place

    async def link_to_plan(
        self,
        plan_id: uuid.UUID,
        place_id: uuid.UUID,
        role: str = "point_of_interest",
    ) -> PlanPlace:
        """Create a PlanPlace association if it doesn't exist."""
        stmt = select(PlanPlace).where(
            PlanPlace.plan_id == plan_id,
            PlanPlace.place_id == place_id,
            PlanPlace.role == role,
        )
        result = await self._db.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            return existing

        pp = PlanPlace(
            plan_id=plan_id,
            place_id=place_id,
            role=role,
        )
        self._db.add(pp)
        await self._db.flush()
        return pp

    async def get_places_for_plan(self, plan_id: uuid.UUID) -> list[Place]:
        """Return all places associated with a plan."""
        stmt = (
            select(Place)
            .join(PlanPlace, PlanPlace.place_id == Place.id)
            .where(PlanPlace.plan_id == plan_id)
        )
        result = await self._db.execute(stmt)
        return list(result.scalars().all())
