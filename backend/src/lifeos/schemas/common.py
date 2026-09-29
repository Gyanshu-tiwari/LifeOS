"""
Common Pydantic schemas used across multiple domain modules.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TimestampMixin(BaseModel):
    """Mixin for created_at/updated_at fields in response schemas."""

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UUIDMixin(BaseModel):
    """Mixin for id field."""

    id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)


class ErrorResponse(BaseModel):
    """Standard error response body."""

    error: str
    code: str | None = None
    request_id: str | None = None


class MessageResponse(BaseModel):
    """Simple success message response."""

    message: str
