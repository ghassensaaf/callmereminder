from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # Vapi Configuration
    vapi_api_key: str = ""
    vapi_phone_number_id: str = ""
    
    # Database
    database_url: str = "sqlite:///./reminders.db"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8-sig",  # Handle BOM in .env file
        extra="ignore"  # Ignore extra fields in .env file
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
