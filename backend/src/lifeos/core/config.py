"""
LIFEOS application settings — loaded from environment / .env file.

Add required fields here; never hardcode secrets in source code.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application
    app_name: str = "LIFEOS API"
    app_version: str = "0.1.0"
    environment: str = "development"
    debug: bool = False

    # Database
    database_url: str = ""

    # Firebase Authentication
    # Set to your Firebase Project ID to verify RS256 Firebase ID tokens.
    firebase_project_id: str = ""

    # AI / Gemini
    # Keep the model ID configurable — never scatter it through code.
    gemini_model: str = "gemini-3.8-flash"
    gemini_fallback_model: str | None = "gemini-2.5-flash"
    gemini_api_key: str = ""

    # Google Maps / Places
    google_maps_api_key: str = ""

    # Optional: async worker (ARQ + Redis)
    # Only needed if running background plan-gen workers.
    # Install: uv add arq redis
    redis_url: str = "redis://localhost:6379"
    worker_max_jobs: int = 10
    plan_run_timeout_seconds: int = 120

    # Observability
    log_level: str = "INFO"

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    @property
    def allowed_cors_origins(self) -> list[str]:
        if not self.cors_origins:
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()