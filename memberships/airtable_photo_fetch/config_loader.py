"""Utility helpers for loading configuration for the Airtable photo exporter."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict

try:
    import yaml  # type: ignore
except ModuleNotFoundError:  # yaml is optional until we actually need it
    yaml = None  # type: ignore


class ConfigError(RuntimeError):
    """Raised when the configuration file cannot be parsed."""


@dataclass
class ExportConfig:
    """Normalized configuration used by the exporter."""

    api_key: str
    base_id: str
    table_name: str
    view_name: str
    email_field: str
    photo_field: str
    output_dir: Path
    concurrent_downloads: int = 4

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ExportConfig":
        try:
            return cls(
                api_key=data["api_key"],
                base_id=data["base_id"],
                table_name=data.get("table_name", "2026 Members - Lightspeed Tracking"),
                view_name=data.get("view_name", "Photo Export"),
                email_field=data.get("email_field", "Email"),
                photo_field=data.get("photo_field", "Photo"),
                output_dir=Path(data["output_dir"]).expanduser(),
                concurrent_downloads=int(data.get("concurrent_downloads", 4)),
            )
        except KeyError as exc:  # surface missing keys early
            raise ConfigError(f"Missing required config key: {exc.args[0]}") from exc


def load_config(path: str | os.PathLike[str]) -> ExportConfig:
    config_path = Path(path)
    if not config_path.exists():
        raise ConfigError(f"Config file not found: {config_path}")

    ext = config_path.suffix.lower()
    raw: Dict[str, Any]
    try:
        if ext in {".yaml", ".yml"}:
            if yaml is None:
                raise ConfigError(
                    "PyYAML is not installed, but a YAML config was provided. "
                    "Install it with `pip install pyyaml` or switch to JSON/.env."
                )
            with config_path.open("r", encoding="utf-8") as fh:
                raw = yaml.safe_load(fh) or {}
        elif ext == ".json":
            raw = json.loads(config_path.read_text(encoding="utf-8"))
        else:  # default to dotenv-style key=value pairs
            raw = _parse_env_file(config_path)
    except ConfigError:
        raise
    except Exception as exc:  # bubble parsing errors as ConfigError
        raise ConfigError(f"Failed parsing {config_path}: {exc}") from exc

    return ExportConfig.from_dict(raw)


def _parse_env_file(path: Path) -> Dict[str, Any]:
    raw: Dict[str, Any] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if "=" not in stripped:
            raise ConfigError(f"Invalid line in env file: {line}")
        key, value = stripped.split("=", 1)
        raw[key.strip()] = value.strip()
    # normalize expected keys to lowercase for consistency
    normalized = {k.lower(): v for k, v in raw.items()}
    return normalized
