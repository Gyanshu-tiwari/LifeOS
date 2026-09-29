"""
Repository integration tests — CRUD, constraints, and transactions.

Tests the repository layer directly against real PostgreSQL,
verifying SQL correctness, constraint enforcement, and query behaviour.
"""

import uuid
import pytest

from lifeos.db.session import AsyncSessionLocal
from lifeos.db.models.user import User
from lifeos.db.models.activity import Activity
from lifeos.db.models.plan import Plan
from lifeos.db.models.plan_section import PlanSection
from lifeos.db.models.task import Task, TaskDependency
from lifeos.repositories.activity import ActivityRepository
from lifeos.repositories.plan import PlanRepository
from lifeos.repositories.task import TaskRepository
from lifeos.repositories.user import UserRepository

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest.fixture(scope="session")
async def db():
    """Session-scoped DB session — one connection for all repo tests."""
    async with AsyncSessionLocal() as session:
        yield session
        await session.rollback()


@pytest.fixture(scope="session")
async def test_user(db):
    """Shared test user for repository tests."""
    repo = UserRepository(db)
    uid = f"repo_test_{uuid.uuid4().hex[:8]}"
    user, _ = await repo.get_or_create(
        firebase_uid=uid,
        email=f"{uid}@test.lifeos.local",
        display_name="Repo Tester",
    )
    await db.commit()
    return user


class TestUserRepository:
    async def test_get_or_create_creates_new_user(self, db):
        repo = UserRepository(db)
        uid = f"new_{uuid.uuid4().hex[:8]}"
        user, created = await repo.get_or_create(
            firebase_uid=uid,
            email=f"{uid}@example.com",
        )
        assert created is True
        assert user.firebase_uid == uid
        await db.commit()

    async def test_get_or_create_returns_existing(self, db, test_user):
        repo = UserRepository(db)
        user, created = await repo.get_or_create(
            firebase_uid=test_user.firebase_uid,
            email=test_user.email,
        )
        assert created is False
        assert user.id == test_user.id


class TestActivityRepository:
    async def test_create_and_get_activity(self, db, test_user):
        repo = ActivityRepository(db)
        act = Activity(
            user_id=test_user.id,
            title="Repo Test Activity",
            raw_intent="Testing repository",
            activity_type="travel",
            status="DRAFT",
        )
        db.add(act)
        await db.flush()

        fetched = await repo.get_by_id_and_user(act.id, test_user.id)
        assert fetched is not None
        assert fetched.title == "Repo Test Activity"
        await db.commit()

    async def test_get_by_wrong_user_returns_none(self, db, test_user):
        repo = ActivityRepository(db)
        act = Activity(
            user_id=test_user.id,
            title="Ownership Test",
            raw_intent="Should not be visible to other user",
            activity_type="errand",
            status="DRAFT",
        )
        db.add(act)
        await db.flush()

        other_user_id = uuid.uuid4()
        fetched = await repo.get_by_id_and_user(act.id, other_user_id)
        assert fetched is None
        await db.commit()

    async def test_list_with_status_filter(self, db, test_user):
        repo = ActivityRepository(db)
        act = Activity(
            user_id=test_user.id,
            title="Archived Activity",
            raw_intent="This is archived",
            activity_type="errand",
            status="ARCHIVED",
        )
        db.add(act)
        await db.flush()

        items, total = await repo.list_for_user(
            test_user.id, limit=100, offset=0, status_filter="ARCHIVED"
        )
        assert total >= 1
        assert all(a.status == "ARCHIVED" for a in items)
        await db.commit()


class TestTaskRepository:
    @pytest.fixture(scope="class")
    async def plan_section(self, db, test_user):
        """Create a plan and section for task tests."""
        act = Activity(
            user_id=test_user.id,
            title="Task Repo Test",
            raw_intent="For task repo tests",
            activity_type="errand",
            status="ACTIVE",
        )
        db.add(act)
        await db.flush()

        plan = Plan(activity_id=act.id, title="Test Plan", status="READY", version=1)
        db.add(plan)
        await db.flush()

        section = PlanSection(plan_id=plan.id, title="Test Section", order_index=0)
        db.add(section)
        await db.flush()
        await db.commit()
        return section

    async def test_create_task(self, db, plan_section):
        repo = TaskRepository(db)
        task = await repo.create_task({
            "plan_section_id": plan_section.id,
            "title": "Repo Task",
            "status": "TODO",
            "priority": "MEDIUM",
        })
        await db.commit()
        assert task.id is not None
        assert task.title == "Repo Task"

    async def test_get_tasks_for_section(self, db, plan_section):
        repo = TaskRepository(db)
        task = await repo.create_task({
            "plan_section_id": plan_section.id,
            "title": "Listed Task",
            "status": "TODO",
            "priority": "HIGH",
        })
        await db.commit()

        tasks = await repo.get_tasks_for_section(plan_section.id)
        titles = [t.title for t in tasks]
        assert "Listed Task" in titles

    async def test_count_tasks_by_status(self, db, plan_section):
        repo = TaskRepository(db)
        task = await repo.create_task({
            "plan_section_id": plan_section.id,
            "title": "Done Task",
            "status": "COMPLETED",
            "priority": "LOW",
        })
        await db.commit()

        counts = await repo.count_tasks_by_status([plan_section.id])
        assert counts.get("COMPLETED", 0) >= 1

    async def test_create_and_delete_dependency(self, db, plan_section):
        repo = TaskRepository(db)
        t1 = await repo.create_task({
            "plan_section_id": plan_section.id,
            "title": "Dep Task A",
            "status": "TODO",
            "priority": "HIGH",
        })
        t2 = await repo.create_task({
            "plan_section_id": plan_section.id,
            "title": "Dep Task B",
            "status": "TODO",
            "priority": "MEDIUM",
        })
        await db.commit()

        await repo.create_dependency(t2.id, t1.id)
        await db.commit()

        deps = await repo.get_dependencies_for_task(t2.id)
        assert any(d.depends_on_id == t1.id for d in deps)

        removed = await repo.delete_dependency(t2.id, t1.id)
        assert removed is True
        await db.commit()

        deps_after = await repo.get_dependencies_for_task(t2.id)
        assert not any(d.depends_on_id == t1.id for d in deps_after)
