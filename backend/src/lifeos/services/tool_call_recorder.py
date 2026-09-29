"""
Tool call recording — persists every external provider call as a ToolCall row.

Usage:
    async with record_tool_call(db, plan_run_id, "google_places", "google") as recorder:
        result = await search_places(...)
        recorder.set_response_summary({"count": len(result)})

The context manager handles:
  - STARTED → SUCCEEDED / FAILED status transitions
  - latency measurement
  - error code capture
  - always-persist even on exception
"""

import hashlib
import json
import time
import uuid
from contextlib import asynccontextmanager
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from lifeos.core.logging import get_logger
from lifeos.db.models.tool_call import ToolCall

logger = get_logger(__name__)


class _ToolCallRecorder:
    """Mutable context object for recording in-flight tool calls."""

    def __init__(self, tool_call: ToolCall, db: AsyncSession) -> None:
        self._tool_call = tool_call
        self._db = db
        self._response_summary: dict | None = None

    def set_response_summary(self, summary: dict[str, Any]) -> None:
        self._response_summary = summary

    def get_tool_call(self) -> ToolCall:
        return self._tool_call


@asynccontextmanager
async def record_tool_call(
    db: AsyncSession,
    plan_run_id: uuid.UUID,
    tool_name: str,
    provider: str | None = None,
    request_data: dict | None = None,
):
    """
    Async context manager that records a ToolCall throughout its lifecycle.

    Yields a recorder object — call recorder.set_response_summary() before
    exiting the block.
    """
    # Compute request hash for deduplication detection
    request_hash = None
    if request_data:
        raw = json.dumps(request_data, sort_keys=True, default=str)
        request_hash = hashlib.sha256(raw.encode()).hexdigest()[:64]

    tool_call = ToolCall(
        plan_run_id=plan_run_id,
        tool_name=tool_name,
        provider=provider,
        status="STARTED",
        request_hash=request_hash,
    )
    db.add(tool_call)
    await db.flush()

    recorder = _ToolCallRecorder(tool_call, db)
    start = time.monotonic()

    try:
        yield recorder

        # Success
        latency_ms = int((time.monotonic() - start) * 1000)
        tool_call.status = "SUCCEEDED"
        tool_call.latency_ms = latency_ms
        tool_call.response_summary_json = recorder._response_summary
        await db.flush()

        logger.info(
            "Tool call succeeded",
            tool_name=tool_name,
            provider=provider,
            latency_ms=latency_ms,
        )

    except Exception as exc:
        latency_ms = int((time.monotonic() - start) * 1000)
        tool_call.status = "FAILED"
        tool_call.latency_ms = latency_ms
        tool_call.error_code = type(exc).__name__
        await db.flush()

        logger.error(
            "Tool call failed",
            tool_name=tool_name,
            provider=provider,
            error=str(exc),
            latency_ms=latency_ms,
        )
        raise  # re-raise so caller can handle
