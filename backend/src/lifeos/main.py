"""
LIFEOS main.py — FastAPI application entrypoint.

Wires up:
- Structured logging
- Firebase initialization
- Request ID correlation middleware
- ARQ Redis pool lifecycle
- API v1 router
- Exception handlers
- Health endpoint
"""

import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from lifeos.core.config import settings
from lifeos.core.exceptions import (
    AIOutputError,
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    LifeOSError,
    NotFoundError,
    ProviderError,
    ValidationError,
)
from lifeos.core.logging import configure_logging, get_logger, request_id_var
from lifeos.core.security import init_firebase

# Configure logging first
configure_logging(debug=settings.debug)
logger = get_logger(__name__)

# Initialize Firebase
init_firebase()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — manage startup and shutdown resources."""
    # Startup: warm up ARQ Redis pool (non-blocking)
    try:
        from lifeos.worker.queue import get_arq_pool
        await get_arq_pool()
    except Exception:
        pass  # Redis optional — plan runs fall back to sync

    yield

    # Shutdown: close ARQ pool and DB engine
    try:
        from lifeos.worker.queue import close_arq_pool
        await close_arq_pool()
    except Exception:
        pass
    try:
        from lifeos.db.session import engine
        await engine.dispose()
    except Exception:
        pass
    logger.info("LIFEOS API shutdown complete")


app = FastAPI(
    title=settings.app_name,
    description="Backend API for LIFEOS — AI-powered real-world activity planner",
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — tighten in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """Attach a unique request ID to every request for correlation."""
    rid = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request_id_var.set(rid)

    start = time.monotonic()
    response = await call_next(request)
    latency_ms = int((time.monotonic() - start) * 1000)

    logger.info(
        "HTTP request",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        latency_ms=latency_ms,
        request_id=rid,
    )

    response.headers["X-Request-ID"] = rid
    return response


# --------------------------------------------------------------------------- #
# Exception handlers — map domain exceptions to HTTP status codes             #
# --------------------------------------------------------------------------- #

@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"error": exc.message, "code": exc.code, "request_id": request_id_var.get()},
    )


@app.exception_handler(ValidationError)
async def validation_error_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": exc.message, "code": exc.code, "request_id": request_id_var.get()},
    )


@app.exception_handler(AuthenticationError)
async def auth_error_handler(request: Request, exc: AuthenticationError):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"error": exc.message, "code": exc.code, "request_id": request_id_var.get()},
    )


@app.exception_handler(AuthorizationError)
async def authz_error_handler(request: Request, exc: AuthorizationError):
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"error": exc.message, "code": exc.code, "request_id": request_id_var.get()},
    )


@app.exception_handler(ConflictError)
async def conflict_handler(request: Request, exc: ConflictError):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"error": exc.message, "code": exc.code, "request_id": request_id_var.get()},
    )


@app.exception_handler(ProviderError)
async def provider_error_handler(request: Request, exc: ProviderError):
    return JSONResponse(
        status_code=status.HTTP_502_BAD_GATEWAY,
        content={"error": exc.message, "code": exc.code, "request_id": request_id_var.get()},
    )


@app.exception_handler(AIOutputError)
async def ai_output_error_handler(request: Request, exc: AIOutputError):
    return JSONResponse(
        status_code=status.HTTP_502_BAD_GATEWAY,
        content={"error": exc.message, "code": exc.code, "request_id": request_id_var.get()},
    )


@app.exception_handler(LifeOSError)
async def lifeos_error_handler(request: Request, exc: LifeOSError):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": exc.message, "code": exc.code, "request_id": request_id_var.get()},
    )


# --------------------------------------------------------------------------- #
# Routes                                                                       #
# --------------------------------------------------------------------------- #

@app.get("/health", tags=["Ops"])
async def health_check():
    """Liveness check — returns ok when the application is running."""
    return {
        "status": "ok",
        "environment": settings.environment,
        "version": settings.app_version,
    }


# Register the v1 API router (after it's implemented in phase 3+)
from lifeos.api.v1.router import router as api_v1_router  # noqa: E402

app.include_router(api_v1_router, prefix="/api/v1")

logger.info(
    "LIFEOS API started",
    environment=settings.environment,
    version=settings.app_version,
)