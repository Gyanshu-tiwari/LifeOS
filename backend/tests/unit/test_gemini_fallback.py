import pytest
import json
from unittest.mock import MagicMock, AsyncMock

from lifeos.integrations.gemini import generate_structured
from lifeos.core.exceptions import ProviderError
from google.genai import errors as genai_errors
from pydantic import BaseModel

class DummySchema(BaseModel):
    status: str

@pytest.fixture(autouse=True)
def mock_sleep(monkeypatch):
    import asyncio
    monkeypatch.setattr(asyncio, "sleep", AsyncMock())

@pytest.fixture
def mock_client(monkeypatch):
    client_mock = MagicMock()
    monkeypatch.setattr("lifeos.integrations.gemini.get_gemini_client", lambda: client_mock)
    return client_mock

@pytest.fixture
def mock_settings(monkeypatch):
    monkeypatch.setattr("lifeos.integrations.gemini.settings.gemini_model", "primary-model")
    monkeypatch.setattr("lifeos.integrations.gemini.settings.gemini_fallback_model", "fallback-model")

def make_response(text):
    resp = MagicMock()
    resp.text = text
    return resp

class MockAPIError(genai_errors.APIError):
    def __init__(self, code):
        self.code = code
        Exception.__init__(self, f"HTTP {code}")

def make_api_error(code):
    return MockAPIError(code)

@pytest.mark.asyncio
async def test_primary_success(mock_client, mock_settings):
    # Test 1: Primary success
    mock_client.models.generate_content.return_value = make_response('{"status": "ok"}')
    result = await generate_structured("prompt", DummySchema)
    
    assert result == {"status": "ok"}
    assert mock_client.models.generate_content.call_count == 1
    call_args = mock_client.models.generate_content.call_args[1]
    assert call_args["model"] == "primary-model"

@pytest.mark.asyncio
async def test_primary_temporary_failure_then_success(mock_client, mock_settings):
    # Test 2: Primary temporary failure -> retry success
    mock_client.models.generate_content.side_effect = [
        make_api_error(503),
        make_response('{"status": "recovered"}')
    ]
    
    result = await generate_structured("prompt", DummySchema)
    
    assert result == {"status": "recovered"}
    assert mock_client.models.generate_content.call_count == 2
    # both calls should be to primary-model
    for call in mock_client.models.generate_content.call_args_list:
        assert call[1]["model"] == "primary-model"

@pytest.mark.asyncio
async def test_primary_fails_fallback_success(mock_client, mock_settings):
    # Test 3: Primary fails -> fallback success
    mock_client.models.generate_content.side_effect = [
        make_api_error(503), # attempt 1
        make_api_error(503), # attempt 2
        make_api_error(503), # attempt 3
        make_response('{"status": "fallback-ok"}') # fallback
    ]
    
    result = await generate_structured("prompt", DummySchema)
    
    assert result == {"status": "fallback-ok"}
    assert mock_client.models.generate_content.call_count == 4
    assert mock_client.models.generate_content.call_args_list[0][1]["model"] == "primary-model"
    assert mock_client.models.generate_content.call_args_list[3][1]["model"] == "fallback-model"

@pytest.mark.asyncio
async def test_primary_permanent_error(mock_client, mock_settings):
    # Test 4: Primary permanent error
    mock_client.models.generate_content.side_effect = make_api_error(401)
    
    with pytest.raises(ProviderError) as exc_info:
        await generate_structured("prompt", DummySchema)
        
    assert not exc_info.value.retryable
    assert mock_client.models.generate_content.call_count == 1
    assert mock_client.models.generate_content.call_args[1]["model"] == "primary-model"

@pytest.mark.asyncio
async def test_both_models_fail(mock_client, mock_settings):
    # Test 5: Both models fail
    mock_client.models.generate_content.side_effect = [
        make_api_error(503), # p1
        make_api_error(503), # p2
        make_api_error(503), # p3
        make_api_error(503)  # f1
    ]
    
    with pytest.raises(ProviderError) as exc_info:
        await generate_structured("prompt", DummySchema)
        
    assert not exc_info.value.retryable
    assert "fallback models failed" in str(exc_info.value)
    assert mock_client.models.generate_content.call_count == 4

@pytest.mark.asyncio
async def test_fallback_structured_output(mock_client, mock_settings):
    # Test 6: Fallback structured output (same schema)
    mock_client.models.generate_content.side_effect = [
        make_api_error(503), make_api_error(503), make_api_error(503),
        make_response('{"status": "fallback-structured"}')
    ]
    
    result = await generate_structured("prompt", DummySchema)
    assert result == {"status": "fallback-structured"}
    # The config should be passed properly
    fallback_call_config = mock_client.models.generate_content.call_args_list[3][1]["config"]
    assert fallback_call_config.response_schema == DummySchema
    assert fallback_call_config.response_mime_type == "application/json"

@pytest.mark.asyncio
async def test_fallback_invalid_structured_output(mock_client, mock_settings):
    # Test 7: Fallback invalid structured output
    mock_client.models.generate_content.side_effect = [
        make_api_error(503), make_api_error(503), make_api_error(503),
        make_response('invalid json here')
    ]
    
    with pytest.raises(ProviderError) as exc_info:
        await generate_structured("prompt", DummySchema)
        
    assert not exc_info.value.retryable
    assert "invalid JSON" in str(exc_info.value)

@pytest.mark.asyncio
async def test_no_fallback_configured(mock_client, monkeypatch):
    # Test 8: No fallback configured
    monkeypatch.setattr("lifeos.integrations.gemini.settings.gemini_model", "primary-model")
    monkeypatch.setattr("lifeos.integrations.gemini.settings.gemini_fallback_model", None)
    
    mock_client.models.generate_content.side_effect = [
        make_api_error(503), make_api_error(503), make_api_error(503)
    ]
    
    with pytest.raises(ProviderError) as exc_info:
        await generate_structured("prompt", DummySchema)
        
    assert exc_info.value.retryable # The top level error is from primary which exhausted retryable tries
    assert "Primary model failed after 3 attempts" in str(exc_info.value)
    assert mock_client.models.generate_content.call_count == 3
    for call in mock_client.models.generate_content.call_args_list:
        assert call[1]["model"] == "primary-model"

@pytest.mark.asyncio
async def test_primary_success_no_fallback_called(mock_client, mock_settings):
    # Test 9: Primary success doesn't touch fallback
    mock_client.models.generate_content.return_value = make_response('{"status": "ok"}')
    
    await generate_structured("prompt", DummySchema)
    
    assert mock_client.models.generate_content.call_count == 1
    assert mock_client.models.generate_content.call_args[1]["model"] == "primary-model"

