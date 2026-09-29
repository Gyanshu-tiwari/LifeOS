"""FastAPI dependency for injecting an async database session."""

from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from lifeos.db.session import AsyncSessionLocal


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Yield an AsyncSession for the current request.

    Transaction lifecycle:
    - Session opens a new transaction implicitly on first use
    - On success: dep commits the transaction
    - On exception: dep rolls back the transaction

    Services must NOT call commit() or rollback() directly.
    They should only call flush() to stage changes within the transaction.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            try:
                await session.rollback()
            except Exception:
                pass  # connection may already be dead
            raise


# Annotated type alias for cleaner route signatures
DbSession = Annotated[AsyncSession, Depends(get_db)]
