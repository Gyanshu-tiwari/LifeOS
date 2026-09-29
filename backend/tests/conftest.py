"""
Root conftest.py — session-scoped fixtures and engine management.

The key challenge: asyncpg connection pool is bound to the asyncio event loop
that created it. pytest-asyncio with function-scoped event loops (the default)
creates a new loop per test, making the pool unusable.

Solution: Use session-scoped event loop via pytest-asyncio's loop_scope setting,
so all tests share one event loop and one connection pool.
"""

import asyncio
import pytest

from lifeos.main import app
from lifeos.db.session import engine


@pytest.fixture(scope="session")
def event_loop_policy():
    """Use the default asyncio event loop policy."""
    return asyncio.DefaultEventLoopPolicy()


@pytest.fixture(scope="session", autouse=True)
async def dispose_engine():
    """Ensure the async engine pool is properly disposed after all tests."""
    yield
    await engine.dispose()
