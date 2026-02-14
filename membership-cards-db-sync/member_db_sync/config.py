from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


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
    _load_dotenv_file(Path(".env"))
    database_path = os.getenv("DATABASE_PATH", DEFAULT_WINDOWS_DATABASE_PATH)
    return AppConfig(
        airtable_api_key=_required_env("AIRTABLE_API_KEY"),
        airtable_base_id=_required_env("AIRTABLE_BASE_ID"),
        airtable_table_name=os.getenv("AIRTABLE_TABLE_NAME", DEFAULT_AIRTABLE_TABLE_NAME).strip(),
        airtable_view_name=os.getenv("AIRTABLE_VIEW_NAME", DEFAULT_AIRTABLE_VIEW_NAME).strip(),
        database_path=_normalize_database_path(database_path),
    )


def _load_dotenv_file(dotenv_path: Path) -> None:
    if not dotenv_path.exists():
        return
    for line in dotenv_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value
