"""
Plan and task Pydantic schemas.
"""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


# ─── Plan ────────────────────────────────────────────────────────────────── #

class PlanSectionResponse(BaseModel):
    id: uuid.UUID
    plan_id: uuid.UUID
    title: str
    description: str | None
    section_type: str | None
    order_index: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskResponse(BaseModel):
    id: uuid.UUID
    plan_section_id: uuid.UUID
    parent_task_id: uuid.UUID | None
    title: str
    description: str | None
    status: str
    priority: str
    due_at: datetime | None
    estimated_minutes: int | None
    source: str | None
    metadata_json: dict[str, Any] | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskWithSubtasksResponse(TaskResponse):
    """Task response with nested subtasks."""
    subtasks: list["TaskWithSubtasksResponse"] = []

    model_config = ConfigDict(from_attributes=True)


class PlanResponse(BaseModel):
    id: uuid.UUID
    activity_id: uuid.UUID
    title: str
    status: str
    version: int
    created_from_run_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PlanDetailResponse(PlanResponse):
    """Plan response with nested sections and tasks."""
    sections: list[PlanSectionResponse] = []


class PlanProgressResponse(BaseModel):
    """Summary of task completion progress for a plan."""
    plan_id: uuid.UUID
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    blocked_tasks: int
    completion_percent: float


class NextActionResponse(BaseModel):
    """The next actionable task for a plan."""
    plan_id: uuid.UUID
    task: TaskResponse | None
    message: str


# ─── Task operations ─────────────────────────────────────────────────────── #

class TaskCreate(BaseModel):
    plan_section_id: uuid.UUID
    title: str = Field(..., min_length=1, max_length=512)
    description: str | None = None
    parent_task_id: uuid.UUID | None = None
    priority: str = "MEDIUM"
    due_at: datetime | None = None
    estimated_minutes: int | None = Field(default=None, ge=1)
    metadata_json: dict[str, Any] | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=512)
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    due_at: datetime | None = None
    estimated_minutes: int | None = None
    metadata_json: dict[str, Any] | None = None


class TaskDependencyCreate(BaseModel):
    depends_on_id: uuid.UUID


# ─── Place ───────────────────────────────────────────────────────────────── #

class PlaceResponse(BaseModel):
    id: uuid.UUID
    provider: str
    provider_place_id: str
    name: str | None
    formatted_address: str | None
    latitude: float | None
    longitude: float | None
    primary_type: str | None
    rating: float | None
    website_uri: str | None
    phone: str | None

    model_config = ConfigDict(from_attributes=True)


# ─── Packing Item ─────────────────────────────────────────────────────────── #

class PackingItemResponse(BaseModel):
    id: uuid.UUID
    plan_id: uuid.UUID
    item: str
    category: str | None
    priority: str
    quantity: int | None
    reason: str | None
    checked_at: datetime | None   # set when user marks item as packed
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @property
    def is_packed(self) -> bool:
        return self.checked_at is not None


class PackingItemUpdate(BaseModel):
    checked: bool | None = None   # set True to mark packed, False to unpack
    item: str | None = None
    category: str | None = None
    priority: str | None = None
    reason: str | None = None


# ─── Itinerary Item ───────────────────────────────────────────────────────── #

class ItineraryItemResponse(BaseModel):
    id: uuid.UUID
    plan_id: uuid.UUID
    place_id: uuid.UUID | None
    task_id: uuid.UUID | None
    title: str
    description: str | None
    order_index: int
    status: str
    start_at: datetime | None
    end_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ItineraryItemUpdate(BaseModel):
    status: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    title: str | None = None
    description: str | None = None


# ─── Route ───────────────────────────────────────────────────────────────── #

class RouteResponse(BaseModel):
    id: uuid.UUID
    plan_id: uuid.UUID
    origin_text: str | None
    destination_text: str | None
    travel_mode: str | None
    distance_meters: int | None
    duration_seconds: int | None
    provider: str | None

    model_config = ConfigDict(from_attributes=True)
