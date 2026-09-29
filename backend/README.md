# LIFEOS Backend

AI-powered real-world activity planner backend.

Turns a user's natural-language intention into a context-aware action plan, including tasks, dependencies, packing lists, itinerary, and map routes.

---

## Requirements

- Python 3.12
- PostgreSQL 14+
- [`uv`](https://docs.astral.sh/uv/) package manager

Optional (for background workers):
- Redis 7+
- `arq` + `redis` packages

---

## Quick Start (Local Development)

### 1. Clone and set up environment

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL at minimum
```

### 2. Install dependencies

```bash
uv sync
```

### 3. Create the PostgreSQL database

```bash
psql -U postgres -c "CREATE USER lifeos_user WITH PASSWORD 'change-this-password';"
psql -U postgres -c "CREATE DATABASE lifeos_db OWNER lifeos_user;"
```

### 4. Run migrations

```bash
uv run alembic upgrade head
```

### 5. Start the development server

```bash
uv run uvicorn lifeos.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection: `postgresql+asyncpg://user:pass@host/db` |
| `GEMINI_API_KEY` | For AI | Gemini API key |
| `GEMINI_MODEL` | No | Default: `gemini-3.8-flash` |
| `GEMINI_FALLBACK_MODEL` | No | Default: `None` |
| `GOOGLE_MAPS_API_KEY` | For maps | Google Maps Platform key |
| `FIREBASE_PROJECT_ID` | For auth | Firebase project ID (leave blank to bypass auth in dev) |
| `LOG_LEVEL` | No | Default: `INFO` |
| `REDIS_URL` | Optional | Redis URL for background workers |

---

## Core Flow

```
POST /api/v1/activities          → Create activity from intent
POST /api/v1/activities/{id}/plan-runs  → Trigger AI plan generation
GET  /api/v1/plans/{id}          → Get generated plan
GET  /api/v1/plans/{id}/next-action     → What to do next
GET  /api/v1/plans/{id}/progress        → Plan progress summary
PATCH /api/v1/tasks/{id}/complete       → Mark task done
```

---

## API Reference

Interactive docs: `GET /docs` (always available)

### Activities

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/activities` | Create activity from natural-language intent |
| `GET` | `/api/v1/activities` | List activities (filterable by status) |
| `GET` | `/api/v1/activities/{id}` | Get activity |
| `PATCH` | `/api/v1/activities/{id}` | Update activity |
| `POST` | `/api/v1/activities/{id}/plan-runs` | Trigger plan generation |
| `GET` | `/api/v1/activities/{id}/plan-runs` | List plan runs |
| `GET` | `/api/v1/activities/{id}/plan-runs/{run_id}` | Get run status |
| `GET` | `/api/v1/activities/{id}/plan-runs/{run_id}/events` | SSE stream |

### Plans

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/plans/{id}` | Get plan with sections and tasks |
| `GET` | `/api/v1/plans/{id}/progress` | Section-level progress |
| `GET` | `/api/v1/plans/{id}/next-action` | Next actionable task |
| `GET` | `/api/v1/plans/{id}/places` | Places associated with plan |

### Tasks

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/tasks` | Create task |
| `GET` | `/api/v1/tasks/{id}` | Get task |
| `PATCH` | `/api/v1/tasks/{id}` | Update task |
| `POST` | `/api/v1/tasks/{id}/complete` | Mark complete |
| `POST` | `/api/v1/tasks/{id}/reopen` | Reopen task |
| `POST` | `/api/v1/tasks/{id}/dependencies` | Add dependency |
| `DELETE` | `/api/v1/tasks/{id}/dependencies/{dep_id}` | Remove dependency |

### Places & Routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/places/search` | Text search for places |
| `GET` | `/api/v1/places/nearby` | Nearby search |
| `POST` | `/api/v1/routes/compute` | Compute route between points |

---

## Testing

```bash
# All tests
uv run pytest tests/ -v

# Unit tests only (fast, no DB)
uv run pytest tests/unit/ -v

# Integration tests (requires PostgreSQL)
uv run pytest tests/integration/ -v

# Agent evaluation (requires GEMINI_API_KEY)
uv run python tests/evaluation/run_eval.py

# Dry run evaluation (no API calls)
uv run python tests/evaluation/run_eval.py --dry-run
```

---

## Project Structure

```
backend/
├── src/lifeos/
│   ├── agents/          # AI agents (understanding, planner, maps)
│   ├── api/v1/          # FastAPI routers
│   ├── core/            # Config, exceptions, logging, security
│   ├── db/              # Models, session, dependencies
│   ├── integrations/    # External SDK wrappers (Gemini, Maps, Places)
│   ├── repositories/    # Database access layer
│   ├── schemas/         # Pydantic request/response models
│   ├── services/        # Business logic
│   ├── worker/          # Optional async job worker (ARQ)
│   └── main.py          # Application entrypoint
├── alembic/             # Database migrations
├── tests/
│   ├── unit/            # Mocked unit tests
│   ├── integration/     # DB + API integration tests
│   └── evaluation/      # AI golden scenario evaluation
├── Dockerfile
├── .env.example
└── pyproject.toml
```

---

## Running with Docker

```bash
# Build
docker build -t lifeos-backend .

# Run (pass environment via --env-file)
docker run -p 8080:8080 --env-file .env lifeos-backend
```

The container:
- Runs as non-root user
- Applies Alembic migrations on startup
- Listens on `$PORT` (default 8080, Cloud Run compatible)

---

## Database Migrations

```bash
# Apply migrations
uv run alembic upgrade head

# Create new migration after model change
uv run alembic revision --autogenerate -m "description"

# Show migration history
uv run alembic history
```

---

## Background Workers (Optional)

For async plan generation without blocking HTTP:

```bash
# Install optional worker deps
uv add arq redis

# Start Redis (e.g. via Docker)
docker run -d -p 6379:6379 redis:7

# Set REDIS_URL in .env
# REDIS_URL=redis://localhost:6379

# Start worker
uv run arq lifeos.worker.jobs.WorkerSettings
```

Without Redis, plan generation runs synchronously in the HTTP request.

---

## Security Notes

- Never commit `.env` — use `.env.example` as template
- Firebase auth is bypassed in development when `FIREBASE_PROJECT_ID` is empty
- All API keys are read from environment only
- Production: use a secret manager (e.g. Google Secret Manager)
