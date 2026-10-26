"""Notification repository — data access for user notifications."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from lifeos.db.models.notification import Notification


class NotificationRepository:
    """Database access layer for Notification."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        limit: int = 50,
        offset: int = 0,
        unread_only: bool = False,
    ) -> list[Notification]:
        """Fetch notifications for a user sorted newest first."""
        stmt = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            stmt = stmt.where(Notification.read_at.is_(None))
        stmt = stmt.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def get_unread_count(self, user_id: uuid.UUID) -> int:
        """Count unread notifications for a user."""
        stmt = (
            select(func.count(Notification.id))
            .where(Notification.user_id == user_id)
            .where(Notification.read_at.is_(None))
        )
        result = await self._db.execute(stmt)
        return result.scalar_one() or 0

    async def get_by_id_and_user(
        self,
        notification_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Notification | None:
        """Fetch a single notification scoped to the user."""
        stmt = (
            select(Notification)
            .where(Notification.id == notification_id)
            .where(Notification.user_id == user_id)
        )
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def mark_as_read(
        self,
        notification_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Notification | None:
        """Mark a single notification as read if owned by the user."""
        notification = await self.get_by_id_and_user(notification_id, user_id)
        if notification and notification.read_at is None:
            notification.read_at = datetime.now(tz=timezone.utc)
            await self._db.flush()
            await self._db.refresh(notification)
        return notification

    async def mark_all_as_read(self, user_id: uuid.UUID) -> int:
        """Mark all unread notifications as read for the user."""
        now = datetime.now(tz=timezone.utc)
        stmt = (
            update(Notification)
            .where(Notification.user_id == user_id)
            .where(Notification.read_at.is_(None))
            .values(read_at=now)
        )
        result = await self._db.execute(stmt)
        await self._db.flush()
        return int(getattr(result, "rowcount", 0) or 0)

    async def create_notification(
        self,
        user_id: uuid.UUID,
        type: str,
        title: str,
        message: str,
        entity_type: str | None = None,
        entity_id: uuid.UUID | None = None,
        action_url: str | None = None,
        idempotent: bool = True,
    ) -> Notification:
        """
        Create a notification for a user.

        If idempotent=True and entity_id is given, checks if an existing
        notification with same (user_id, type, entity_id) exists to avoid duplicates.
        """
        if idempotent and entity_id is not None:
            stmt = (
                select(Notification)
                .where(Notification.user_id == user_id)
                .where(Notification.type == type)
                .where(Notification.entity_id == entity_id)
            )
            existing = (await self._db.execute(stmt)).scalar_one_or_none()
            if existing:
                return existing

        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            entity_type=entity_type,
            entity_id=entity_id,
            action_url=action_url,
        )
        self._db.add(notification)
        await self._db.flush()
        await self._db.refresh(notification)
        return notification
