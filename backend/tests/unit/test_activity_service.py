"""
Unit tests for ActivityService.
"""

import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock

from lifeos.core.exceptions import NotFoundError, ValidationError
from lifeos.core.security import VerifiedUser
from lifeos.services.activity_service import ActivityService
from lifeos.db.models.activity import Activity
from lifeos.db.models.user import User
from lifeos.schemas.activity import ActivityCreate, ActivityUpdate


def _make_user() -> User:
    u = User()
    u.id = uuid.uuid4()
    u.firebase_uid = "test_uid"
    u.email = "test@lifeos.local"
    u.display_name = "Tester"
    return u


def _make_activity(user_id: uuid.UUID) -> Activity:
    from datetime import datetime, timezone
    a = Activity()
    a.id = uuid.uuid4()
    a.user_id = user_id
    a.title = "Test Activity"
    a.raw_intent = "Go hiking in the mountains"
    a.activity_type = "travel"
    a.status = "DRAFT"
    a.start_at = None
    a.end_at = None
    a.origin_text = None
    a.destination_text = None
    a.travel_mode = None
    a.constraints_json = None
    a.created_at = datetime.now(tz=timezone.utc)
    a.updated_at = datetime.now(tz=timezone.utc)
    return a


def _verified_user() -> VerifiedUser:
    return VerifiedUser(firebase_uid="test_uid", email="test@lifeos.local", display_name="Tester")


class TestActivityServiceGet:
    @pytest.fixture
    def svc(self):
        db = AsyncMock()
        return ActivityService(db)

    async def test_get_activity_raises_not_found(self, svc):
        user = _make_user()
        svc._user_repo = AsyncMock()
        svc._user_repo.get_or_create = AsyncMock(return_value=(user, False))
        svc._activity_repo = AsyncMock()
        svc._activity_repo.get_by_id_and_user = AsyncMock(return_value=None)

        with pytest.raises(NotFoundError):
            await svc.get_activity(uuid.uuid4(), _verified_user())

    async def test_get_activity_returns_activity(self, svc):
        user = _make_user()
        activity = _make_activity(user.id)
        svc._user_repo = AsyncMock()
        svc._user_repo.get_or_create = AsyncMock(return_value=(user, False))
        svc._activity_repo = AsyncMock()
        svc._activity_repo.get_by_id_and_user = AsyncMock(return_value=activity)

        result = await svc.get_activity(activity.id, _verified_user())
        assert result.id == activity.id


class TestActivityServiceList:
    @pytest.fixture
    def svc(self):
        db = AsyncMock()
        return ActivityService(db)

    async def test_invalid_limit_raises_validation_error(self, svc):
        with pytest.raises(ValidationError):
            await svc.list_activities(_verified_user(), limit=0)

    async def test_invalid_offset_raises_validation_error(self, svc):
        with pytest.raises(ValidationError):
            await svc.list_activities(_verified_user(), offset=-1)

    async def test_invalid_status_raises_validation_error(self, svc):
        with pytest.raises(ValidationError):
            await svc.list_activities(_verified_user(), status_filter="INVALID")
