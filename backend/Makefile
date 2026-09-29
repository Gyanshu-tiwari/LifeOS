.PHONY: dev test test-unit test-integration migrate migrate-new lint check install eval

# ── Setup ────────────────────────────────────────────────────────────────────
install:
	uv sync

# ── Development ──────────────────────────────────────────────────────────────
dev:
	uv run uvicorn lifeos.main:app --reload --port 8000

# ── Database ─────────────────────────────────────────────────────────────────
migrate:
	uv run alembic upgrade head

migrate-new:
	@read -p "Migration description: " desc; \
	uv run alembic revision --autogenerate -m "$$desc"

migrate-history:
	uv run alembic history --verbose

# ── Testing ──────────────────────────────────────────────────────────────────
test:
	uv run pytest tests/ -v

test-unit:
	uv run pytest tests/unit/ -v

test-integration:
	uv run pytest tests/integration/ -v

# ── Evaluation (requires GEMINI_API_KEY) ─────────────────────────────────────
eval:
	uv run python tests/evaluation/run_eval.py

eval-dry:
	uv run python tests/evaluation/run_eval.py --dry-run

# ── Docker ───────────────────────────────────────────────────────────────────
docker-build:
	docker build -t lifeos-backend .

docker-run:
	docker run -p 8080:8080 --env-file .env lifeos-backend

# ── Lint / Type Check ────────────────────────────────────────────────────────
lint:
	uv run ruff check src/ tests/

check:
	uv run mypy src/lifeos --ignore-missing-imports
