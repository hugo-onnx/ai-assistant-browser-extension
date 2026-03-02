from typing import Literal

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Provider selection
    provider: Literal["groq", "cerebras"] = "groq"

    # Groq
    groq_api_key: str = ""
    groq_model: str = "llama-3.1-8b-instant"

    # Cerebras
    cerebras_api_key: str = ""
    cerebras_model: str = "llama3.1-8b"

    # Sampling parameters
    temperature: float = 1.0
    top_p: float = 1.0
    max_completion_tokens: int = 8192

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "info"

    # CORS
    allowed_origins: str = "*"

    @property
    def cors_origins(self) -> list[str]:
        if self.allowed_origins == "*":
            return ["*"]
        return [o.strip() for o in self.allowed_origins.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
