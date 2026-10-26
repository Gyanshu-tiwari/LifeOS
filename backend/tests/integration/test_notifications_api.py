"""Integration tests for Notifications API."""

import uuid
import pytest
from httpx import AsyncClient, ASGITransport

from lifeos.main import app
from lifeos.db.deps import get_db
from lifeos.repositories.notification import NotificationRepository
from lifeos.repositories.user import UserRepository
from lifeos.core.security import verify_firebase_token, VerifiedUser

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest.fixture(scope="session")
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestNotificationsAPI:
    async def test_list_notifications_empty_or_items(self, client):
        r = await client.get("/api/v1/notifications")
        assert r.status_code == 200
        data = r.json()
        assert "items" in data
        assert "unread_count" in data
        assert "total" in data

    async def test_unread_count_endpoint(self, client):
        r = await client.get("/api/v1/notifications/unread-count")
        assert r.status_code == 200
        data = r.json()
        assert "unread_count" in data
        assert isinstance(data["unread_count"], int)

    async def test_create_and_mark_notification_read(self, client):
        # Create a notification directly via repository for the test user
        user_repo = UserRepository(app.state.test_db if hasattr(app.state, 'test_db') else None)
        # Or create via an internal helper / test session
        async for session in get_db():
            u_repo = UserRepository(session)
            user, _ = await u_repo.get_or_create("test_uid", "test@lifeos.local", "Test User")
            n_repo = NotificationRepository(session)
            notif = await n_repo.create_notification(
                user_id=user.id,
                type="PLAN_READY",
                title="Your Test Plan",
                message="Plan is ready for exploration.",
                action_url="/plans/test-123",
                idempotent=False,
            )
            await session.commit()
            notif_id = str(notif.id)
            break

        # Verify it shows up in unread list
        r = await client.get("/api/v1/notifications")
        assert r.status_code == 200
        items = r.json()["items"]
        found = [i for i in items if i["id"] == notif_id]
        assert len(found) == 1
        assert found[0]["read_at"] is None

        # Mark as read
        patch_r = await client.patch(f"/api/v1/notifications/{notif_id}/read")
        assert patch_r.status_code == 200
        assert patch_r.json()["read_at"] is not None

        # Mark all read
        post_r = await client.post("/api/v1/notifications/read-all")
        assert post_r.status_code == 200
        assert "updated_count" in post_r.json()

    async def test_mark_nonexistent_returns_404(self, client):
        r = await client.patch(f"/api/v1/notifications/{uuid.uuid4()}/read")
        assert r.status_code == 404
