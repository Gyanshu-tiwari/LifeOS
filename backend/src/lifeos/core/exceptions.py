"""
LIFEOS custom exception hierarchy.

These exceptions map cleanly to HTTP status codes in the API layer.
Business logic raises these; routes catch and convert them.
"""


class LifeOSError(Exception):
    """Base exception for all LIFEOS application errors."""

    def __init__(self, message: str, code: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.code = code or self.__class__.__name__


class NotFoundError(LifeOSError):
    """Resource not found. Maps to HTTP 404."""


class ValidationError(LifeOSError):
    """Input validation failure. Maps to HTTP 422."""


class AuthenticationError(LifeOSError):
    """Authentication failure. Maps to HTTP 401."""


class AuthorizationError(LifeOSError):
    """Authorization / ownership failure. Maps to HTTP 403."""


class ConflictError(LifeOSError):
    """State conflict (e.g. duplicate idempotency key). Maps to HTTP 409."""


class ProviderError(LifeOSError):
    """External provider call failure. May be retried."""

    def __init__(
        self,
        message: str,
        provider: str | None = None,
        retryable: bool = False,
        code: str | None = None,
    ) -> None:
        super().__init__(message, code)
        self.provider = provider
        self.retryable = retryable


class AIOutputError(LifeOSError):
    """AI model output failed schema validation. Maps to HTTP 502."""


class PlanRunError(LifeOSError):
    """PlanRun state machine error."""
