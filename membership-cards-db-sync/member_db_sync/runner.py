from __future__ import annotations

import logging

from .config import AppConfig


def run_sync(config: AppConfig, confirm_empty: bool) -> int:
    logging.info("Starting member DB sync scaffold run.")
    logging.info(
        "Configured Airtable target: table='%s', view='%s'",
        config.airtable_table_name,
        config.airtable_view_name,
    )
    logging.info("Configured SQLite path: %s", config.database_path)
    logging.info("Empty-result prune override (--confirm-empty): %s", confirm_empty)

    logging.warning(
        "Scaffold only: Airtable fetch and SQLite sync implementation will be added in Action 2/3."
    )
    return 0

