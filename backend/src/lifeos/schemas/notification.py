"""Pydantic schemas for notifications."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    """Notification response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    title: str
    message: str
    read_at: datetime | None = None
    entity_type: str | None = None
    entity_id: uuid.UUID | None = None
    action_url: str | None = None
    created_at: datetime


class NotificationListResponse(BaseModel):
    """List of notifications with unread count."""

    items: list[NotificationResponse]
    unread_count: int
    total: int


class UnreadCountResponse(BaseModel):
    """Unread notifications count schema."""

    unread_count: int
