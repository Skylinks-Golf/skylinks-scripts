"""Command-line tool to export Airtable member photos and rename them by email."""

from __future__ import annotations

import argparse
import logging
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, Iterable, List, Optional

import requests

from config_loader import ConfigError, ExportConfig, load_config

AIRTABLE_API_URL = "https://api.airtable.com/v0"
CHUNK_SIZE = 1024 * 64


class AirtableClient:
    """Thin wrapper around Airtable's REST API."""

    def __init__(self, config: ExportConfig):
        self.base_url = f"{AIRTABLE_API_URL}/{config.base_id}"
        self.session = requests.Session()
        self.session.headers.update({"Authorization": f"Bearer {config.api_key}"})

    def iter_records(self, table: str, view: str) -> Iterable[Dict]:
        """Yield all records from the given table + view."""
        url = f"{self.base_url}/{requests.utils.quote(table)}"
        params: Dict[str, str] = {"view": view, "pageSize": "100"}
        offset: Optional[str] = None
        while True:
            if offset:
                params["offset"] = offset
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            payload = response.json()
            for record in payload.get("records", []):
                yield record
            offset = payload.get("offset")
            if not offset:
                break


class PhotoExporter:
    """Coordinates fetching Airtable records and downloading photo attachments."""

    def __init__(self, config: ExportConfig):
        self.config = config
        self.client = AirtableClient(config)
        self.output_dir = config.output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def run(self) -> None:
        logging.info(
            "Starting export: table=%s view=%s output=%s",
            self.config.table_name,
            self.config.view_name,
            self.output_dir,
        )
        records = list(self.client.iter_records(self.config.table_name, self.config.view_name))
        tasks = self._prepare_tasks(records)
        if not tasks:
            logging.warning("No records with both email + photo were found.")
            return
        self._download_all(tasks)

    def _prepare_tasks(self, records: List[Dict]) -> List[Dict]:
        prepared: List[Dict] = []
        skipped_existing = 0
        skipped_incomplete = 0
        for record in records:
            fields = record.get("fields", {})
            email = fields.get(self.config.email_field)
            attachments = fields.get(self.config.photo_field) or []
            if not email or not attachments:
                skipped_incomplete += 1
                continue
            attachment = attachments[0]
            filename = build_filename(str(email).strip(), attachment.get("filename"))
            target = self.output_dir / filename
            if target.exists():
                skipped_existing += 1
                continue
            prepared.append(
                {"email": str(email).strip(), "attachment": attachment, "target": target}
            )
        if skipped_incomplete:
            logging.info("Skipped %d record(s) missing email or photo", skipped_incomplete)
        if skipped_existing:
            logging.info("Skipped %d record(s) whose photos already exist", skipped_existing)
        return prepared

    def _download_all(self, tasks: List[Dict]) -> None:
        logging.info("Downloading %d photo(s) with %d worker(s)", len(tasks), self.config.concurrent_downloads)
        with ThreadPoolExecutor(max_workers=self.config.concurrent_downloads) as executor:
            future_map = {
                executor.submit(self._download_one, task["email"], task["attachment"], task["target"]): task
                for task in tasks
            }
            for future in as_completed(future_map):
                email = future_map[future]["email"]
                try:
                    future.result()
                    logging.info("Saved photo for %s", email)
                except Exception as exc:  # noqa: BLE001
                    logging.error("Failed downloading %s: %s", email, exc)

    def _download_one(self, email: str, attachment: Dict, target: Path) -> None:
        url = attachment.get("url")
        if not url:
            raise ValueError("Attachment missing url field")
        with requests.get(url, stream=True, timeout=60) as response:
            response.raise_for_status()
            with target.open("wb") as fh:
                for chunk in response.iter_content(CHUNK_SIZE):
                    if chunk:
                        fh.write(chunk)


def build_filename(email: str, original_filename: Optional[str]) -> str:
    email_part = sanitize_email(email)
    ext = Path(original_filename).suffix if original_filename else ".jpg"
    if not ext:
        ext = ".jpg"
    return f"{email_part}{ext}"


def sanitize_email(email: str) -> str:
    safe_chars = ["-", "_", "."]
    return "".join(ch if ch.isalnum() or ch in safe_chars else "-" for ch in email.lower())


def parse_args(argv: List[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--config",
        default=".env",
        help="Path to config file (.env, .json, .yaml). Default: .env",
    )
    parser.add_argument(
        "--log-level",
        default=os.getenv("LOG_LEVEL", "INFO"),
        help="Logging level (DEBUG, INFO, WARNING, ...). Default: INFO",
    )
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    logging.basicConfig(
        level=getattr(logging, str(args.log_level).upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(message)s",
    )
    try:
        config = load_config(args.config)
    except ConfigError as exc:
        logging.error("Config error: %s", exc)
        return 1

    exporter = PhotoExporter(config)
    try:
        exporter.run()
    except requests.HTTPError as exc:
        logging.error("Airtable API error: %s", describe_http_error(exc))
        return 1
    except Exception as exc:  # noqa: BLE001
        logging.exception("Unexpected failure: %s", exc)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


def describe_http_error(exc: requests.HTTPError) -> str:
    response = exc.response
    if response is None:
        return str(exc)
    snippet = (response.text or "").strip().replace("\n", " ")[:500]
    return (
        f"status={response.status_code} url={response.url} "
        f"reason={response.reason} body={snippet or '<empty>'}"
    )
