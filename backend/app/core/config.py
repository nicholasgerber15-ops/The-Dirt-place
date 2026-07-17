# UNIVERSAL NRG-CO HEADER BLOCK
# Use this exact banner at the top of source files. License/covenant terms still apply.
# 
################################################################
#                                                              #
#                ⚡  N R G - C O  ⚡                          #
#                                                              #
#    CRITICAL ASSET — CLOSED SOURCE / CONFIDENTIAL              #
#    PROPRIETARY / UNDER DEVELOPMENT / SECRET                   #
#                                                              #
################################################################
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./sitemanager.db"
    mongodb_url: str = ""
    mongodb_db_name: str = "sitemanager"
    redis_url: str = ""
    secret_key: str = "dev-secret-key-change-in-production"

    # My Finn Model LLM
    myfinn_model_url: str = "http://localhost:11434"
    myfinn_model_name: str = "my-finn-model"
    myfinn_api_key: str = ""

    # Cloudflare
    cloudflare_api_token: str = ""
    cloudflare_zone_id: str = ""
    cloudflare_account_id: str = ""

    # Cloudflare R2
    r2_account_id: str = ""
    r2_bucket: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_public_base: str = ""

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_service_key: str = ""

    # Azure
    azure_subscription_id: str = ""
    azure_tenant_id: str = ""
    azure_client_id: str = ""
    azure_client_secret: str = ""

    # Railway
    railway_api_token: str = ""

    # WordPress
    wordpress_default_user: str = ""
    wordpress_default_app_password: str = ""

    # Auth
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Monitoring
    monitor_interval_seconds: int = 60
    heartbeat_timeout_seconds: int = 30

    # SMTP
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
