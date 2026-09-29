"""
Structured logging configuration for LIFEOS.

Uses structlog with a JSON-compatible format suitable for Cloud Logging.
Every significant log event should carry correlation IDs.
"""

import logging
import sys
import uuid
from contextvars import ContextVar
from typing import Any

import structlog

# Context variables for correlation IDs — set per request
request_id_var: ContextVar[str] = ContextVar("request_id", default="")
user_id_var: ContextVar[str] = ContextVar("user_id", default="")
activity_id_var: ContextVar[str] = ContextVar("activity_id", default="")
plan_id_var: ContextVar[str] = ContextVar("plan_id", default="")
plan_run_id_var: ContextVar[str] = ContextVar("plan_run_id", default="")


def add_correlation_ids(
    logger: Any, method: str, event_dict: dict[str, Any]
) -> dict[str, Any]:
    """Structlog processor: inject correlation IDs from context variables."""
    if rid := request_id_var.get():
        event_dict["request_id"] = rid
    if uid := user_id_var.get():
        event_dict["user_id"] = uid
    if aid := activity_id_var.get():
        event_dict["activity_id"] = aid
    if pid := plan_id_var.get():
        event_dict["plan_id"] = pid
    if prid := plan_run_id_var.get():
        event_dict["plan_run_id"] = prid
    return event_dict


def configure_logging(debug: bool = False) -> None:
    """
    Configure structlog for LIFEOS.

    In development: human-readable ConsoleRenderer.
    In production: JSON renderer for Cloud Logging.
    """
    log_level = logging.DEBUG if debug else logging.INFO

    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        add_correlation_ids,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if debug:
        renderer = structlog.dev.ConsoleRenderer()
    else:
        renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=[*shared_processors, renderer],
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
        cache_logger_on_first_use=True,
    )

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )


def get_logger(name: str | None = None) -> structlog.BoundLogger:
    """Return a bound structlog logger."""
    return structlog.get_logger(name)


def new_request_id() -> str:
    """Generate a new request correlation ID."""
    return str(uuid.uuid4())
