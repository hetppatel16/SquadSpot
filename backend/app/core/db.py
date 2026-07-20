"""Supabase client initialization for SquadSpot.

Environment variables required:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict
from supabase import Client, create_client


class SupabaseSettings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_supabase_settings() -> SupabaseSettings:
    return SupabaseSettings()


@lru_cache
def get_supabase_client() -> Client:
    settings = get_supabase_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)


@lru_cache
def get_supabase_admin_client() -> Client:
    settings = get_supabase_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
