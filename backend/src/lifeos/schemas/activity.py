"""
Activity Pydantic schemas — request validation and response contracts.
"""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ActivityCreate(BaseModel):
    """Request body for creating a new Activity."""

    title: str = Field(..., min_length=1, max_length=512)
    raw_intent: str = Field(..., min_length=1)
    activity_type: str = Field(..., min_length=1, max_length=64)

    # Optional structured fields
    start_at: datetime | None = None
    end_at: datetime | None = None
    origin_text: str | None = None
    destination_text: str | None = None
    travel_mode: str | None = Field(
        default=None,
        description="DRIVE | TRANSIT | WALK | BICYCLE | TWO_WHEELER",
    )
    constraints_json: dict[str, Any] | None = None

    @field_validator("travel_mode")
    @classmethod
    def validate_travel_mode(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = {"DRIVE", "TRANSIT", "WALK", "BICYCLE", "TWO_WHEELER"}
        if v.upper() not in allowed:
            raise ValueError(f"travel_mode must be one of {allowed}")
        return v.upper()

    @field_validator("activity_type")
    @classmethod
    def validate_activity_type(cls, v: str) -> str:
        return v.strip()


class ActivityUpdate(BaseModel):
    """Request body for partially updating an Activity (PATCH semantics)."""

    title: str | None = Field(default=None, min_length=1, max_length=512)
    raw_intent: str | None = Field(default=None, min_length=1)
    activity_type: str | None = Field(default=None, min_length=1, max_length=64)
    status: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    origin_text: str | None = None
    destination_text: str | None = None
    travel_mode: str | None = None
    constraints_json: dict[str, Any] | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = {"DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"}
        if v.upper() not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v.upper()

    @field_validator("travel_mode")
    @classmethod
    def validate_travel_mode(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = {"DRIVE", "TRANSIT", "WALK", "BICYCLE", "TWO_WHEELER"}
        if v.upper() not in allowed:
            raise ValueError(f"travel_mode must be one of {allowed}")
        return v.upper()


class ActivityResponse(BaseModel):
    """Response schema for a single Activity."""

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    raw_intent: str
    activity_type: str
    status: str
    start_at: datetime | None
    end_at: datetime | None
    origin_text: str | None
    destination_text: str | None
    travel_mode: str | None
    constraints_json: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActivityListResponse(BaseModel):
    """Response schema for a paginated list of Activities."""

    items: list[ActivityResponse]
    total: int
    limit: int
    offset: int
