"""
Route repository — database access for Route and RouteStop records.
"""

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from lifeos.db.models.route import Route
from lifeos.db.models.route_stop import RouteStop


class RouteRepository:
    """Database access for Route and RouteStop."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create_route(self, plan_id: uuid.UUID, data: dict[str, Any]) -> Route:
        route = Route(plan_id=plan_id, **data)
        self._db.add(route)
        await self._db.flush()
        await self._db.refresh(route)
        return route

    async def get_route_for_plan(self, plan_id: uuid.UUID) -> Route | None:
        stmt = select(Route).where(Route.plan_id == plan_id)
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_stop(
        self, route_id: uuid.UUID, place_id: uuid.UUID | None, data: dict[str, Any]
    ) -> RouteStop:
        stop = RouteStop(route_id=route_id, place_id=place_id, **data)
        self._db.add(stop)
        await self._db.flush()
        return stop

    async def get_stops_for_route(self, route_id: uuid.UUID) -> list[RouteStop]:
        stmt = (
            select(RouteStop)
            .where(RouteStop.route_id == route_id)
            .order_by(RouteStop.order_index)
        )
        result = await self._db.execute(stmt)
        return list(result.scalars().all())
