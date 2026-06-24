from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Server
    port: int = 3001
    environment: str = "development"
    log_level: str = "INFO"

    # Database
    database_url: str = "sqlite+aiosqlite:///../database/veedoria.db"

    # Auth
    jwt_secret: str = "cambiar_esto_por_un_secreto_seguro_y_largo_en_produccion"
    jwt_algorithm: str = "HS256"

    # DGCP API
    dgcp_api_base_url: str = "https://datosabiertos.dgcp.gob.do/api-dgcp/v1"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
