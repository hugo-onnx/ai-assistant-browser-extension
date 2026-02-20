from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # IBM watsonx Orchestrate
    ibm_api_key: str
    wxo_api_endpoint: str
    wxo_agent_id: str

    # IAM
    iam_token_url: str = "https://iam.cloud.ibm.com/identity/token"
    token_refresh_margin_seconds: int = 300

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

    @property
    def wxo_base(self) -> str:
        return self.wxo_api_endpoint.rstrip("/")

    @property
    def wxo_runs_url(self) -> str:
        """Orchestrate runs endpoint: /v1/orchestrate/runs"""
        return f"{self.wxo_base}/v1/orchestrate/runs"

    @property
    def wxo_stream_url(self) -> str:
        """Orchestrate runs streaming: /v1/orchestrate/runs?stream=true"""
        return f"{self.wxo_base}/v1/orchestrate/runs?stream=true"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()