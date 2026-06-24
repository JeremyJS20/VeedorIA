from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Server
    port: int = 3001
    environment: str = "development"
    log_level: str = "INFO"

    # Database
    database_url: str = "sqlite+aiosqlite:///../database/veedoria.db"
    postgres_url: str | None = None

    # Auth
    jwt_secret: str = "cambiar_esto_por_un_secreto_seguro_y_largo_en_produccion"
    jwt_algorithm: str = "HS256"

    # DGCP API
    dgcp_api_base_url: str = "https://datosabiertos.dgcp.gob.do/api-dgcp/v1"
    dgcp_request_timeout: int = 30
    dgcp_max_retries: int = 3
    dgcp_retry_base_delay: float = 1.0

    # Sync
    sync_incremental: bool = False
    sync_batch_size: int = 500
    sync_rate_limit: float = 1.0

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
