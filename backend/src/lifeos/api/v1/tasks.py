"""
Tasks API routes — Phase 4 implementation.

Endpoints:
  POST   /api/v1/tasks                           Create task
  GET    /api/v1/tasks/{id}                      Get task
  PATCH  /api/v1/tasks/{id}                      Update task
  POST   /api/v1/tasks/{id}/complete             Complete task
  POST   /api/v1/tasks/{id}/reopen               Reopen task
  POST   /api/v1/tasks/{id}/dependencies         Add dependency
  DELETE /api/v1/tasks/{id}/dependencies/{dep}   Remove dependency
"""

import uuid

from fastapi import APIRouter, status

from lifeos.core.security import CurrentUser
from lifeos.db.deps import DbSession
from lifeos.schemas.plan import (
    TaskCreate,
    TaskDependencyCreate,
    TaskResponse,
    TaskUpdate,
)
from lifeos.services.task_service import TaskService

router = APIRouter()


def _svc(db: DbSession) -> TaskService:
    return TaskService(db)


@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a task",
)
async def create_task(
    payload: TaskCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> TaskResponse:
    svc = _svc(db)
    task = await svc.create_task(payload)
    return TaskResponse.model_validate(task)


@router.get("/{task_id}", response_model=TaskResponse, summary="Get a task")
async def get_task(
    task_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> TaskResponse:
    svc = _svc(db)
    task = await svc.get_task(task_id)
    return TaskResponse.model_validate(task)


@router.patch("/{task_id}", response_model=TaskResponse, summary="Update a task")
async def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    db: DbSession,
    current_user: CurrentUser,
) -> TaskResponse:
    svc = _svc(db)
    task = await svc.update_task(task_id, payload)
    return TaskResponse.model_validate(task)


@router.post(
    "/{task_id}/complete",
    response_model=TaskResponse,
    summary="Complete a task",
)
async def complete_task(
    task_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> TaskResponse:
    svc = _svc(db)
    task = await svc.complete_task(task_id)
    return TaskResponse.model_validate(task)


@router.post(
    "/{task_id}/reopen",
    response_model=TaskResponse,
    summary="Reopen a task",
)
async def reopen_task(
    task_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> TaskResponse:
    svc = _svc(db)
    task = await svc.reopen_task(task_id)
    return TaskResponse.model_validate(task)


@router.post(
    "/{task_id}/dependencies",
    status_code=status.HTTP_201_CREATED,
    summary="Add a task dependency",
    description="Makes task_id depend on the specified task. Rejects self-dependencies and cycles.",
)
async def add_dependency(
    task_id: uuid.UUID,
    payload: TaskDependencyCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> dict:
    svc = _svc(db)
    await svc.add_dependency(task_id, payload.depends_on_id)
    return {
        "task_id": str(task_id),
        "depends_on_id": str(payload.depends_on_id),
        "message": "Dependency added",
    }


@router.delete(
    "/{task_id}/dependencies/{depends_on_id}",
    status_code=status.HTTP_200_OK,
    summary="Remove a task dependency",
)
async def remove_dependency(
    task_id: uuid.UUID,
    depends_on_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> dict:
    svc = _svc(db)
    await svc.remove_dependency(task_id, depends_on_id)
    return {"message": "Dependency removed"}
