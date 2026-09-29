"""
Optional ARQ Redis connection pool for the API.

Returns None when Redis/ARQ is not installed or not reachable.
The API uses this to enqueue background jobs; falls back to
synchronous execution when unavailable.
"""

from lifeos.core.config import settings
from lifeos.core.logging import get_logger

logger = get_logger(__name__)

_pool = None


async def get_arq_pool():
    """
    Return a shared ARQ Redis pool, or None if ARQ/Redis is unavailable.

    ARQ and redis are optional dependencies for MVP.
    Install with: uv add arq redis
    """
    global _pool
    if _pool is not None:
        return _pool

    try:
        from arq import create_pool
        from arq.connections import RedisSettings

        url = settings.redis_url
        if url.startswith("redis://"):
            parts = url.replace("redis://", "").split(":")
            host = parts[0]
            port = int(parts[1].split("/")[0]) if len(parts) > 1 else 6379
        else:
            host, port = "localhost", 6379

        _pool = await create_pool(
            RedisSettings(host=host, port=port),
            default_queue_name="lifeos:plans",
        )
        logger.info("ARQ Redis pool connected", url=settings.redis_url)
    except ImportError:
        logger.debug("arq/redis not installed — background workers disabled")
        _pool = None
    except Exception as exc:
        logger.warning(
            "Redis unavailable — plan runs will execute synchronously",
            error=str(exc),
        )
        _pool = None

    return _pool


async def close_arq_pool() -> None:
    global _pool
    if _pool is not None:
        try:
            await _pool.aclose()
        except Exception:
            pass
        _pool = None
        logger.info("ARQ Redis pool closed")
