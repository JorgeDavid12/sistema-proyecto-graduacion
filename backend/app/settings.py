from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Mototaxi David API"
    app_env: str = "development"
    database_url: str = "sqlite:///./backend/mototaxi_david.db"
    cors_origins: str = "http://127.0.0.1:5173,http://localhost:5173"
    ai_external_enabled: bool = False
    ai_provider: str = ""
    ai_model: str = ""
    ai_api_key: str = ""
    ai_cost_acknowledged: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def has_ai_api_key(self) -> bool:
        return bool(self.ai_api_key.strip())


@lru_cache
def get_settings() -> Settings:
    return Settings()
