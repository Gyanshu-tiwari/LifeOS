"""
Integration tests for Activity API endpoints.

Uses the real FastAPI app + PostgreSQL.
Each test creates its own activity (fully independent).
"""

import pytest
import uuid
from httpx import AsyncClient, ASGITransport

from lifeos.main import app

# Force session-scoped event loop for all tests in this module.
# asyncpg connection pool is bound to the event loop that created it;
# using function-scoped loops causes 'Future attached to different loop' errors.
pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest.fixture(scope="session")
async def client():
    """
    Session-scoped ASGI client.

    Must be session-scoped to share the same asyncio event loop as the
    asyncpg connection pool. Function-scoped clients cause 'Future attached
    to different loop' errors during fixture teardown.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


PAYLOAD = {
    "title": "Test Integration Activity",
    "raw_intent": "I want to go hiking in the Himalayas for 5 days.",
    "activity_type": "travel",
    "origin_text": "Delhi",
    "destination_text": "Manali",
    "travel_mode": "DRIVE",
}


async def create_activity(client: AsyncClient) -> dict:
    """Helper: create and return a new activity."""
    r = await client.post("/api/v1/activities", json=PAYLOAD)
    assert r.status_code == 201, f"Setup failed: {r.status_code} {r.text}"
    return r.json()


class TestHealthEndpoint:
    async def test_health_returns_ok(self, client):
        r = await client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


class TestActivityCreate:
    async def test_create_returns_201(self, client):
        r = await client.post("/api/v1/activities", json=PAYLOAD)
        assert r.status_code == 201
        data = r.json()
        assert data["title"] == PAYLOAD["title"]
        assert data["status"] == "DRAFT"
        assert uuid.UUID(data["id"])

    async def test_invalid_travel_mode_returns_422(self, client):
        r = await client.post("/api/v1/activities", json={**PAYLOAD, "travel_mode": "HELICOPTER"})
        assert r.status_code == 422

    async def test_missing_required_fields_returns_422(self, client):
        r = await client.post("/api/v1/activities", json={"title": "Incomplete"})
        assert r.status_code == 422


class TestActivityGet:
    async def test_get_activity(self, client):
        activity = await create_activity(client)
        r = await client.get(f"/api/v1/activities/{activity['id']}")
        assert r.status_code == 200
        assert r.json()["id"] == activity["id"]

    async def test_get_nonexistent_returns_404(self, client):
        r = await client.get(f"/api/v1/activities/{uuid.uuid4()}")
        assert r.status_code == 404
        assert r.json()["code"] == "ACTIVITY_NOT_FOUND"


class TestActivityList:
    async def test_list_returns_200(self, client):
        await create_activity(client)
        r = await client.get("/api/v1/activities")
        assert r.status_code == 200
        data = r.json()
        assert "items" in data and "total" in data
        assert data["total"] >= 1

    async def test_list_pagination(self, client):
        r = await client.get("/api/v1/activities?limit=1&offset=0")
        assert r.status_code == 200
        assert len(r.json()["items"]) <= 1

    async def test_list_invalid_limit_returns_422(self, client):
        r = await client.get("/api/v1/activities?limit=0")
        assert r.status_code == 422


class TestActivityPatch:
    async def test_patch_status(self, client):
        activity = await create_activity(client)
        r = await client.patch(f"/api/v1/activities/{activity['id']}", json={"status": "ACTIVE"})
        assert r.status_code == 200
        assert r.json()["status"] == "ACTIVE"

    async def test_patch_title(self, client):
        activity = await create_activity(client)
        r = await client.patch(
            f"/api/v1/activities/{activity['id']}",
            json={"title": "Updated Title"},
        )
        assert r.status_code == 200
        assert r.json()["title"] == "Updated Title"

    async def test_patch_invalid_status_returns_422(self, client):
        activity = await create_activity(client)
        r = await client.patch(
            f"/api/v1/activities/{activity['id']}",
            json={"status": "INVALID_STATUS"},
        )
        assert r.status_code == 422
