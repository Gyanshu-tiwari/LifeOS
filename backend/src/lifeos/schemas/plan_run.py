"""
PlanRun schemas.
"""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class PlanRunStartRequest(BaseModel):
    """Request body for starting a plan generation run."""
    idempotency_key: str | None = None


class PlanRunResponse(BaseModel):
    id: uuid.UUID
    activity_id: uuid.UUID
    plan_id: uuid.UUID | None
    status: str
    model: str | None
    prompt_version: str | None
    idempotency_key: str | None
    started_at: datetime | None
    finished_at: datetime | None
    error_code: str | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
