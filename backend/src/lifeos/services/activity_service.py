"""
ActivityService — business logic for the Activity domain.

Owns:
- Authorization/ownership checks
- Domain rule enforcement
- Transaction orchestration via repository calls
"""

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from lifeos.core.exceptions import AuthorizationError, NotFoundError, ValidationError
from lifeos.core.logging import get_logger
from lifeos.core.security import VerifiedUser
from lifeos.db.models.activity import Activity
from lifeos.repositories.activity import ActivityRepository
from lifeos.repositories.user import UserRepository
from lifeos.schemas.activity import ActivityCreate, ActivityUpdate

logger = get_logger(__name__)

VALID_STATUSES = {"DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"}


class ActivityService:
    """Application service for Activity operations."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._activity_repo = ActivityRepository(db)
        self._user_repo = UserRepository(db)

    async def _resolve_user(self, verified: VerifiedUser) -> Any:
        """
        Ensure an internal User row exists for the authenticated caller.
        Creates it on first-ever request for that firebase_uid.
        """
        user, created = await self._user_repo.get_or_create(
            firebase_uid=verified.firebase_uid,
            email=verified.email,
            display_name=verified.display_name,
        )
        if created:
            logger.info("New user provisioned", firebase_uid=verified.firebase_uid)
        return user

    async def create_activity(
        self, payload: ActivityCreate, verified: VerifiedUser
    ) -> Activity:
        """
        Create a new Activity from user intent.

        The user row is provisioned automatically if it doesn't exist.
        """
        user = await self._resolve_user(verified)

        data = payload.model_dump(exclude_unset=False)
        activity = await self._activity_repo.create(
            user_id=user.id, data=data
        )
        # commit handled by get_db dependency

        logger.info(
            "Activity created",
            activity_id=str(activity.id),
            activity_type=activity.activity_type,
        )
        return activity

    async def get_activity(
        self, activity_id: uuid.UUID, verified: VerifiedUser
    ) -> Activity:
        """
        Fetch a single Activity, enforcing ownership.

        Raises NotFoundError if not found or not owned by the caller.
        """
        user = await self._resolve_user(verified)
        activity = await self._activity_repo.get_by_id_and_user(
            activity_id=activity_id, user_id=user.id
        )
        if activity is None:
            raise NotFoundError(
                f"Activity {activity_id} not found",
                code="ACTIVITY_NOT_FOUND",
            )
        return activity

    async def list_activities(
        self,
        verified: VerifiedUser,
        limit: int = 20,
        offset: int = 0,
        status_filter: str | None = None,
    ) -> tuple[list[Activity], int]:
        """List Activities for the authenticated user."""
        if limit < 1 or limit > 100:
            raise ValidationError("limit must be between 1 and 100")
        if offset < 0:
            raise ValidationError("offset must be >= 0")
        if status_filter and status_filter.upper() not in VALID_STATUSES:
            raise ValidationError(
                f"status must be one of {VALID_STATUSES}",
                code="INVALID_STATUS",
            )

        user = await self._resolve_user(verified)
        return await self._activity_repo.list_for_user(
            user_id=user.id,
            limit=limit,
            offset=offset,
            status_filter=status_filter.upper() if status_filter else None,
        )

    async def update_activity(
        self,
        activity_id: uuid.UUID,
        payload: ActivityUpdate,
        verified: VerifiedUser,
    ) -> Activity:
        """
        Partially update an Activity (PATCH semantics).

        Only non-None fields in the payload are applied.
        Raises NotFoundError if not found or AuthorizationError if not owned.
        """
        activity = await self.get_activity(activity_id, verified)

        updates = {
            k: v for k, v in payload.model_dump(exclude_unset=True).items()
            if v is not None
        }

        if not updates:
            return activity  # nothing to do

        activity = await self._activity_repo.update(activity, updates)
        # commit handled by get_db dependency

        logger.info(
            "Activity updated",
            activity_id=str(activity_id),
            fields=list(updates.keys()),
        )
        return activity
