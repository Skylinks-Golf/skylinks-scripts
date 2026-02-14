from __future__ import annotations

import os
from dataclasses import dataclass


DEFAULT_AIRTABLE_TABLE_NAME = "2026 Members - Lightspeed Tracking"
DEFAULT_AIRTABLE_VIEW_NAME = "Awaiting Membership Card"
DEFAULT_WINDOWS_DATABASE_PATH = r"C:\data\skylinks\membersdb\members.db"


@dataclass(frozen=True)
class AppConfig:
    airtable_api_key: str
    airtable_base_id: str
    airtable_table_name: str
    airtable_view_name: str
    database_path: str


class ConfigError(ValueError):
    pass


def _normalize_database_path(raw_value: str) -> str:
    value = raw_value.strip().strip('"').strip("'")
    if not value:
        raise ConfigError("DATABASE_PATH cannot be empty.")

    if value.endswith(("\\", "/")):
        return f"{value}members.db"

    normalized_lower = value.lower()
    if normalized_lower.endswith(".db"):
        return value

    if normalized_lower.endswith("membersdb"):
        separator = "\\" if "\\" in value else "/"
        return f"{value}{separator}members.db"

    return value


def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ConfigError(f"Missing required environment variable: {name}")
    return value


def load_config() -> AppConfig:
    database_path = os.getenv("DATABASE_PATH", DEFAULT_WINDOWS_DATABASE_PATH)
    return AppConfig(
        airtable_api_key=_required_env("AIRTABLE_API_KEY"),
        airtable_base_id=_required_env("AIRTABLE_BASE_ID"),
        airtable_table_name=os.getenv("AIRTABLE_TABLE_NAME", DEFAULT_AIRTABLE_TABLE_NAME).strip(),
        airtable_view_name=os.getenv("AIRTABLE_VIEW_NAME", DEFAULT_AIRTABLE_VIEW_NAME).strip(),
        database_path=_normalize_database_path(database_path),
    )

