"""Notifications API router — authenticated user notification endpoints."""

import uuid

from fastapi import APIRouter, HTTPException, Query, status

from lifeos.core.security import CurrentUser
from lifeos.db.deps import DbSession
from lifeos.repositories.notification import NotificationRepository
from lifeos.repositories.user import UserRepository
from lifeos.schemas.notification import (
    NotificationListResponse,
    NotificationResponse,
    UnreadCountResponse,
)

router = APIRouter()


async def _resolve_user(db: DbSession, current_user: CurrentUser):
    user_repo = UserRepository(db)
    user, _ = await user_repo.get_or_create(
        current_user.firebase_uid,
        current_user.email,
        current_user.display_name,
    )
    return user


@router.get(
    "",
    response_model=NotificationListResponse,
    summary="List user notifications",
    description="Retrieve notifications for the authenticated user with read/unread tracking.",
)
async def list_notifications(
    db: DbSession,
    current_user: CurrentUser,
    limit: int = Query(default=30, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    unread_only: bool = Query(default=False),
) -> NotificationListResponse:
    user = await _resolve_user(db, current_user)
    repo = NotificationRepository(db)

    items = await repo.list_for_user(
        user.id, limit=limit, offset=offset, unread_only=unread_only
    )
    unread_count = await repo.get_unread_count(user.id)

    return NotificationListResponse(
        items=[NotificationResponse.model_validate(n) for n in items],
        unread_count=unread_count,
        total=len(items),
    )


@router.get(
    "/unread-count",
    response_model=UnreadCountResponse,
    summary="Get unread notification count",
    description="Returns the number of unread notifications for the active user.",
)
async def get_unread_count(
    db: DbSession,
    current_user: CurrentUser,
) -> UnreadCountResponse:
    user = await _resolve_user(db, current_user)
    repo = NotificationRepository(db)
    count = await repo.get_unread_count(user.id)
    return UnreadCountResponse(unread_count=count)


@router.patch(
    "/{id}/read",
    response_model=NotificationResponse,
    summary="Mark notification as read",
    description="Mark a specific notification as read. Fails with 404 if not found or unauthorized.",
)
async def mark_notification_read(
    id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> NotificationResponse:
    user = await _resolve_user(db, current_user)
    repo = NotificationRepository(db)

    notification = await repo.mark_as_read(id, user.id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    return NotificationResponse.model_validate(notification)


@router.post(
    "/read-all",
    summary="Mark all notifications as read",
    description="Batch marks all unread notifications for the current user as read.",
)
async def mark_all_read(
    db: DbSession,
    current_user: CurrentUser,
) -> dict[str, int]:
    user = await _resolve_user(db, current_user)
    repo = NotificationRepository(db)
    updated_count = await repo.mark_all_as_read(user.id)
    return {"updated_count": updated_count}
