"""
User repository — get or create application user records.

Firebase verification is handled in security.py; this manages the
internal User row that maps firebase_uid → LIFEOS UUID.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from lifeos.db.models.user import User


class UserRepository:
    """Database access layer for User."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_firebase_uid(self, firebase_uid: str) -> User | None:
        """Fetch user by Firebase UID."""
        stmt = select(User).where(User.firebase_uid == firebase_uid)
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        """Fetch user by internal UUID."""
        stmt = select(User).where(User.id == user_id)
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_or_create(
        self,
        firebase_uid: str,
        email: str,
        display_name: str | None = None,
    ) -> tuple[User, bool]:
        """
        Return the existing User or create a new one.

        Returns (user, created) where created=True means it was just inserted.
        """
        existing = await self.get_by_firebase_uid(firebase_uid)
        if existing:
            # Update display name if it changed
            if display_name and existing.display_name != display_name:
                existing.display_name = display_name
                await self._db.flush()
            return existing, False

        user = User(
            firebase_uid=firebase_uid,
            email=email,
            display_name=display_name,
        )
        self._db.add(user)
        await self._db.flush()
        await self._db.refresh(user)
        return user, True
