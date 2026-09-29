# ── LIFEOS Backend — Multi-stage Dockerfile ──────────────────────────────────
#
# Stage 1: builder — install deps with uv
# Stage 2: runtime — minimal image, no build tools
#
# Build:  docker build -t lifeos-backend .
# Run:    docker run -p 8000:8000 --env-file .env lifeos-backend
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: builder ─────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy dependency files first for layer caching
COPY pyproject.toml uv.lock ./

# Install all dependencies (no dev group) into /app/.venv
RUN uv sync --frozen --no-dev --no-install-project

# Copy source
COPY src/ ./src/
COPY alembic/ ./alembic/
COPY alembic.ini ./

# Install the project itself
RUN uv sync --frozen --no-dev


# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

# Create non-root user
RUN groupadd --gid 1001 lifeos && \
    useradd --uid 1001 --gid lifeos --no-create-home lifeos

WORKDIR /app

# Copy venv and source from builder
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/src /app/src
COPY --from=builder /app/alembic /app/alembic
COPY --from=builder /app/alembic.ini /app/alembic.ini

# Activate venv
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH="/app/src" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Cloud Run sends traffic on $PORT (default 8080)
ENV PORT=8080

USER lifeos

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/health')"

EXPOSE $PORT

# Run migrations then start server
# migrations are applied before the server starts to avoid race conditions.
CMD alembic upgrade head && \
    uvicorn lifeos.main:app \
        --host 0.0.0.0 \
        --port ${PORT} \
        --workers 1 \
        --no-access-log
