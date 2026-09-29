"""
Provider integration tests — Maps and Places adapters with mocked responses.

Tests that:
  - ProviderError is raised on API failures
  - Normalized output has expected shape
  - Graceful degradation works (Maps Agent ignores provider failures)
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from lifeos.core.exceptions import ProviderError
from lifeos.agents.activity_understanding import StructuredActivityContext


def _make_context(
    needs_route=True,
    needs_places=False,
    origin="Delhi",
    destination="Manali",
    travel_mode="DRIVE",
) -> StructuredActivityContext:
    return StructuredActivityContext(
        activity_type="travel",
        summary="Drive from Delhi to Manali",
        origin=origin,
        destination=destination,
        travel_mode=travel_mode,
        needs_route=needs_route,
        needs_places=needs_places,
    )


class TestMapsIntegration:
    async def test_compute_route_raises_provider_error_on_api_failure(self):
        """Simulate Google Maps API error → ProviderError raised."""
        with patch("httpx.AsyncClient") as mock_client_class, \
             patch("lifeos.integrations.maps.settings") as mock_settings:
            mock_settings.google_maps_api_key = "test_key"
            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.raise_for_status.side_effect = Exception("HTTP 400")
            mock_client.post.return_value = mock_response
            mock_client_class.return_value.__aenter__.return_value = mock_client

            from lifeos.integrations.maps import compute_route
            with pytest.raises(ProviderError):
                await compute_route("Delhi", "Manali")

    async def test_compute_route_raises_when_no_key(self):
        """No API key → ProviderError with retryable=False."""
        with patch("lifeos.integrations.maps.settings") as mock_settings:
            mock_settings.google_maps_api_key = ""
            from lifeos.integrations.maps import compute_route
            with pytest.raises(ProviderError) as exc_info:
                await compute_route("A", "B")
            assert exc_info.value.retryable is False

    async def test_maps_agent_gracefully_degrades_on_provider_error(self):
        """Maps Agent returns None when provider call fails."""
        context = _make_context(needs_route=True)
        with patch("lifeos.integrations.maps.compute_route", side_effect=ProviderError("fail")):
            from lifeos.agents.maps import get_route_context
            result = await get_route_context(context)
            assert result is None

    async def test_maps_agent_skips_when_no_locations(self):
        """Maps Agent skips route if origin/destination missing."""
        context = _make_context(needs_route=True, origin=None, destination=None)
        from lifeos.agents.maps import get_route_context
        result = await get_route_context(context)
        assert result is None

    async def test_maps_agent_skips_when_not_needed(self):
        """Maps Agent returns None when needs_route=False."""
        context = _make_context(needs_route=False)
        from lifeos.agents.maps import get_route_context
        result = await get_route_context(context)
        assert result is None


class TestPlacesIntegration:
    async def test_places_agent_gracefully_degrades_on_error(self):
        """Places Agent returns [] when search fails."""
        context = _make_context(needs_places=True)
        with patch("lifeos.integrations.places.search_places", side_effect=Exception("network error")):
            from lifeos.agents.recommendation import get_recommended_places
            result = await get_recommended_places(context)
            assert result == []

    async def test_places_agent_skips_when_not_needed(self):
        """Places Agent returns [] when needs_places=False."""
        context = _make_context(needs_places=False)
        from lifeos.agents.recommendation import get_recommended_places
        result = await get_recommended_places(context)
        assert result == []

    async def test_search_places_normalizes_output(self):
        """Mock Places API returns normalized output shape."""
        mock_result = {
            "places": [{
                "id": "ChIJ_test",
                "displayName": {"text": "Test Hotel"},
                "formattedAddress": "123 Main St",
                "location": {"latitude": 28.6, "longitude": 77.2},
                "types": ["lodging"],
                "rating": 4.5,
            }]
        }
        with patch("httpx.AsyncClient") as mock_client_class, \
             patch("lifeos.integrations.places.settings") as mock_settings:
            mock_settings.google_maps_api_key = "test_key"
            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.json.return_value = mock_result
            mock_client.post.return_value = mock_response
            mock_client_class.return_value.__aenter__.return_value = mock_client

            from lifeos.integrations.places import search_places
            results = await search_places("hotels in Manali", max_results=5)

            assert len(results) == 1
            place = results[0]
            assert place["name"] == "Test Hotel"
            assert place["provider"] == "google"
            assert place["provider_place_id"] == "ChIJ_test"
            assert place["latitude"] == 28.6


class TestEvidenceTrustHierarchy:
    """Verify EvidenceService records correct source types and relevance."""

    async def test_user_fact_has_high_relevance(self):
        """user_fact tier always gets high relevance."""
        db = AsyncMock()
        db.flush = AsyncMock()

        from lifeos.services.evidence_service import EvidenceService
        import uuid

        svc = EvidenceService(db, uuid.uuid4())

        # Capture what gets added
        added = []
        db.add = lambda obj: added.append(obj)

        await svc.record_user_fact("User will drive to Manali")
        assert len(added) == 1
        ev = added[0]
        assert ev.source_type == "user_fact"
        assert ev.relevance == "high"

    async def test_inference_has_low_relevance(self):
        """inference tier gets low relevance by default."""
        db = AsyncMock()
        db.flush = AsyncMock()

        from lifeos.services.evidence_service import EvidenceService
        import uuid

        svc = EvidenceService(db, uuid.uuid4())
        added = []
        db.add = lambda obj: added.append(obj)

        await svc.record_inference("Assuming user needs accommodation")
        assert len(added) == 1
        ev = added[0]
        assert ev.source_type == "inference"
        assert ev.relevance == "low"

    async def test_unknown_source_type_defaults_to_unknown(self):
        """Invalid source type is coerced to 'unknown'."""
        db = AsyncMock()
        db.flush = AsyncMock()

        from lifeos.services.evidence_service import EvidenceService
        import uuid

        svc = EvidenceService(db, uuid.uuid4())
        added = []
        db.add = lambda obj: added.append(obj)

        await svc.record("not_a_real_source_type", claim="test")
        assert added[0].source_type == "unknown"
