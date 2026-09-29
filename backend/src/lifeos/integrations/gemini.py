"""
Gemini integration — thin wrapper around the google-genai SDK.

Model ID is always sourced from settings.gemini_model.
Provider-specific logic stays here; services never touch the SDK directly.
"""

from google import genai
from google.genai import types

from lifeos.core.config import settings
from lifeos.core.logging import get_logger

logger = get_logger(__name__)

_client: genai.Client | None = None


def get_gemini_client() -> genai.Client:
    """Return a singleton Gemini client, initialized lazily."""
    global _client
    if _client is None:
        if not settings.gemini_api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not configured. "
                "Set it in .env to enable AI features."
            )
        _client = genai.Client(api_key=settings.gemini_api_key)
        logger.info("Gemini client initialized", model=settings.gemini_model)
    return _client


async def generate_structured(
    prompt: str,
    response_schema: type,
    temperature: float = 0.2,
) -> dict:
    """
    Generate a structured output from Gemini.

    Uses JSON mode with the provided schema for reliable structured output.
    Returns the parsed response as a dict.

    Raises ProviderError if the model fails or returns invalid JSON.
    """
    import asyncio
    import json
    from google.genai import errors as genai_errors
    from lifeos.core.exceptions import ProviderError

    client = get_gemini_client()
    primary_model = settings.gemini_model
    fallback_model = settings.gemini_fallback_model

    max_retries = 3
    base_delay = 1.0

    def is_retryable(exc: Exception) -> bool:
        if isinstance(exc, genai_errors.APIError):
            return exc.code in (429, 500, 502, 503, 504)
        return False

    def _call_model(model_name: str) -> dict:
        logger.info(
            "Gemini structured generation started",
            model=model_name,
            schema=response_schema.__name__,
        )
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=temperature,
                response_mime_type="application/json",
                response_schema=response_schema,
            ),
        )

        if not response.text:
            raise ProviderError("Gemini returned an empty response", provider="gemini", retryable=False)

        try:
            return json.loads(response.text)
        except json.JSONDecodeError as exc:
            raise ProviderError(f"Gemini returned invalid JSON: {exc}", provider="gemini", retryable=False) from exc

    # 1. Primary Model with Bounded Retry
    last_exc = None
    for attempt in range(1, max_retries + 1):
        try:
            result = _call_model(primary_model)
            logger.info("Gemini execution succeeded", model_requested=primary_model, model_used=primary_model, fallback_used=False, attempt_count=attempt)
            return result
        except Exception as exc:
            last_exc = exc
            if is_retryable(exc):
                if attempt < max_retries:
                    delay = base_delay * (2 ** (attempt - 1))
                    logger.warning(f"Gemini primary model failed (attempt {attempt}/{max_retries}). Retrying in {delay}s: {exc}")
                    await asyncio.sleep(delay)
                    continue
                else:
                    logger.warning(f"Gemini primary model retry budget exhausted: {exc}")
                    break
            else:
                logger.error(f"Gemini primary model permanent error: {exc}")
                raise ProviderError(str(exc), provider="gemini", retryable=False) from exc

    # 2. Fallback Model
    if fallback_model:
        logger.info(f"Invoking fallback model: {fallback_model}")
        try:
            result = _call_model(fallback_model)
            logger.info("Gemini execution succeeded", model_requested=primary_model, model_used=fallback_model, fallback_used=True, attempt_count=1)
            return result
        except Exception as exc:
            logger.error(f"Gemini fallback model failed: {exc}")
            raise ProviderError(f"Both primary and fallback models failed. Last fallback error: {exc}", provider="gemini", retryable=False) from exc
    else:
        raise ProviderError(f"Primary model failed after {max_retries} attempts: {last_exc}", provider="gemini", retryable=True) from last_exc
