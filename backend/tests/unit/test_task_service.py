"""
Unit tests for TaskService — dependency graph and cycle detection.
"""

import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from lifeos.core.exceptions import ValidationError
from lifeos.services.task_service import TaskService
from lifeos.db.models.task import Task, TaskDependency


def _make_task(task_id: uuid.UUID, section_id: uuid.UUID, status: str = "TODO", priority: str = "MEDIUM") -> Task:
    t = Task()
    t.id = task_id
    t.plan_section_id = section_id
    t.status = status
    t.priority = priority
    t.title = f"Task {task_id}"
    t.parent_task_id = None
    t.description = None
    t.source = None
    t.metadata_json = None
    t.completed_at = None
    from datetime import datetime, timezone
    t.created_at = datetime.now(tz=timezone.utc)
    t.updated_at = datetime.now(tz=timezone.utc)
    return t


def _make_dep(task_id: uuid.UUID, depends_on_id: uuid.UUID) -> TaskDependency:
    d = TaskDependency()
    d.id = uuid.uuid4()
    d.task_id = task_id
    d.depends_on_id = depends_on_id
    return d


class TestCycleDetection:
    """Tests for TaskService._would_create_cycle."""

    @pytest.fixture
    def svc(self):
        db = AsyncMock()
        return TaskService(db)

    async def test_no_cycle_on_empty_graph(self, svc):
        """A→B in empty graph: no cycle."""
        tid = uuid.uuid4()
        dep_id = uuid.uuid4()
        svc._task_repo = AsyncMock()
        svc._task_repo.get_dependencies_for_task = AsyncMock(return_value=[])
        result = await svc._would_create_cycle(tid, dep_id)
        assert result is False

    async def test_simple_cycle(self, svc):
        """A→B exists; adding B→A would create A→B→A cycle."""
        a = uuid.uuid4()
        b = uuid.uuid4()

        # existing: A depends on B
        dep_ab = _make_dep(a, b)

        async def get_deps(task_id):
            if task_id == a:
                return [dep_ab]  # a → b
            return []

        svc._task_repo = AsyncMock()
        svc._task_repo.get_dependencies_for_task = AsyncMock(side_effect=get_deps)

        # Would adding B→A create a cycle? Yes — following B we find A, which is the source.
        result = await svc._would_create_cycle(b, a)
        assert result is True

    async def test_longer_cycle(self, svc):
        """A→B→C→D; adding D→A creates cycle."""
        a, b, c, d = uuid.uuid4(), uuid.uuid4(), uuid.uuid4(), uuid.uuid4()

        deps = {
            a: [_make_dep(a, b)],
            b: [_make_dep(b, c)],
            c: [_make_dep(c, d)],
            d: [],
        }

        svc._task_repo = AsyncMock()
        svc._task_repo.get_dependencies_for_task = AsyncMock(
            side_effect=lambda tid: deps.get(tid, [])
        )

        result = await svc._would_create_cycle(d, a)
        assert result is True

    async def test_no_cycle_sibling(self, svc):
        """A→B and A→C; adding C→B is not a cycle."""
        a, b, c = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()

        deps = {
            a: [_make_dep(a, b), _make_dep(a, c)],
            b: [],
            c: [],
        }

        svc._task_repo = AsyncMock()
        svc._task_repo.get_dependencies_for_task = AsyncMock(
            side_effect=lambda tid: deps.get(tid, [])
        )

        result = await svc._would_create_cycle(c, b)
        assert result is False


class TestNextAction:
    """Tests for TaskService.compute_next_action."""

    @pytest.fixture
    def svc(self):
        db = AsyncMock()
        return TaskService(db)

    async def test_returns_unblocked_task(self, svc):
        """With no dependencies, highest-priority task is returned."""
        sid = uuid.uuid4()
        t1 = _make_task(uuid.uuid4(), sid, "TODO", "HIGH")
        t2 = _make_task(uuid.uuid4(), sid, "TODO", "LOW")

        svc._task_repo = AsyncMock()
        svc._task_repo.get_tasks_for_plan_sections = AsyncMock(return_value=[t1, t2])
        svc._task_repo.get_all_dependencies_for_sections = AsyncMock(return_value=[])

        result = await svc.compute_next_action([sid])
        assert result is not None
        assert result.id == t1.id

    async def test_blocked_task_skipped(self, svc):
        """Task blocked by incomplete dependency is skipped."""
        sid = uuid.uuid4()
        t1 = _make_task(uuid.uuid4(), sid, "TODO", "ESSENTIAL")
        t2 = _make_task(uuid.uuid4(), sid, "TODO", "LOW")
        dep = _make_dep(t1.id, t2.id)  # t1 depends on t2

        svc._task_repo = AsyncMock()
        svc._task_repo.get_tasks_for_plan_sections = AsyncMock(return_value=[t1, t2])
        svc._task_repo.get_all_dependencies_for_sections = AsyncMock(return_value=[dep])

        # t1 is blocked (t2 not complete), t2 is free → t2 is next
        result = await svc.compute_next_action([sid])
        assert result is not None
        assert result.id == t2.id

    async def test_all_completed_returns_none(self, svc):
        """All tasks done → no next action."""
        sid = uuid.uuid4()
        t1 = _make_task(uuid.uuid4(), sid, "COMPLETED", "HIGH")
        t2 = _make_task(uuid.uuid4(), sid, "COMPLETED", "HIGH")

        svc._task_repo = AsyncMock()
        svc._task_repo.get_tasks_for_plan_sections = AsyncMock(return_value=[t1, t2])
        svc._task_repo.get_all_dependencies_for_sections = AsyncMock(return_value=[])

        result = await svc.compute_next_action([sid])
        assert result is None
