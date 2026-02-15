from __future__ import annotations

import argparse
import logging
import sys

from .config import ConfigError, load_config
from .runner import run_sync


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="member-db-sync",
        description="Sync Airtable membership-card queue records into SQLite for CardImaging.",
    )
    parser.add_argument(
        "--confirm-empty",
        action="store_true",
        help="Allow empty Airtable results to prune the local queue to empty.",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Set console log verbosity.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s %(levelname)s %(message)s",
    )

    try:
        config = load_config()
    except ConfigError as exc:
        logging.error("Configuration error: %s", exc)
        return 2

    return run_sync(config=config, confirm_empty=args.confirm_empty)


if __name__ == "__main__":
    sys.exit(main())

