from __future__ import annotations

import logging
import time
from urllib import error, request

from .airtable import build_member_candidate, fetch_airtable_records
from .config import AppConfig


def run_sync(config: AppConfig, confirm_empty: bool) -> int:
    logging.info("Starting member DB sync run.")
    logging.info(
        "Configured Airtable target: table='%s', view='%s'",
        config.airtable_table_name,
        config.airtable_view_name,
    )
    logging.info("Configured SQLite path: %s", config.database_path)
    logging.info("Empty-result prune override (--confirm-empty): %s", confirm_empty)

    try:
        records = fetch_airtable_records(config=config)
    except Exception as exc:
        logging.error("Airtable fetch failed: %s", exc)
        return 1

    fetched_count = len(records)
    logging.info("airtable_fetched_count=%d", fetched_count)

    if fetched_count == 0 and not confirm_empty:
        logging.error(
            "Airtable returned 0 records and --confirm-empty was not provided; refusing to proceed."
        )
        return 3

    prepared_count = 0
    fallback_to_old_photo_count = 0
    skipped_count = 0
    download_error_count = 0
    rows_to_sync: list[dict[str, object]] = []

    for record in records:
        candidate, reason = build_member_candidate(record)
        if candidate is None:
            skipped_count += 1
            fields = record.get("fields") if isinstance(record.get("fields"), dict) else {}
            member_number = _normalize_log_value((fields.get("Member Number") if isinstance(fields, dict) else ""))
            email = _normalize_log_value((fields.get("Email") if isinstance(fields, dict) else ""))
            logging.warning(
                "record_skipped reason=%s record_id=%s member_number=%s email=%s",
                reason,
                record.get("id", "unknown_record_id"),
                member_number or "-",
                email or "-",
            )
            continue

        prepared_count += 1
        if candidate.used_old_photo_fallback:
            fallback_to_old_photo_count += 1
            logging.info(
                "old_photo_fallback_applied record_id=%s member_number=%s email=%s",
                candidate.airtable_record_id,
                candidate.member_number,
                candidate.email,
            )

        try:
            photo_blob = _download_photo_with_retry(candidate.photo_url)
        except Exception as exc:
            download_error_count += 1
            skipped_count += 1
            logging.error(
                "photo_download_failed record_id=%s member_number=%s email=%s error=%s",
                candidate.airtable_record_id,
                candidate.member_number,
                candidate.email,
                exc,
            )
            continue

        rows_to_sync.append(
            {
                "member_number": candidate.member_number,
                "first_name": candidate.first_name,
                "email": candidate.email,
                "photo": photo_blob,
                "airtable_record_id": candidate.airtable_record_id,
            }
        )

    try:
        from .sqlite_store import MemberRow, sync_members
    except Exception as exc:
        logging.error(
            "SQLite support is unavailable in this Python runtime. "
            "Install a standard Python build that includes sqlite3 and retry."
        )
        logging.debug("sqlite_import_error=%s", exc)
        return 5

    member_rows = [MemberRow(**row) for row in rows_to_sync]

    try:
        sync_result = sync_members(
            database_path=config.database_path,
            members=member_rows,
            allow_empty_prune=confirm_empty,
        )
    except Exception as exc:
        logging.error("sqlite_sync_failed database_path=%s error=%s", config.database_path, exc)
        return 4

    logging.info(
        "sync_summary fetched=%d prepared=%d inserted=%d updated=%d skipped=%d deleted=%d download_errors=%d old_photo_fallback=%d",
        fetched_count,
        prepared_count,
        sync_result.inserted,
        sync_result.updated,
        skipped_count,
        sync_result.deleted,
        download_error_count,
        fallback_to_old_photo_count,
    )
    return 0


def _download_photo_with_retry(url: str, max_retries: int = 3, timeout_s: int = 30) -> bytes:
    if not url:
        raise ValueError("photo_url is empty")

    for attempt in range(max_retries + 1):
        req = request.Request(url, method="GET")
        try:
            with request.urlopen(req, timeout=timeout_s) as response:
                payload = response.read()
                if not payload:
                    raise RuntimeError("downloaded photo is empty")
                return payload
        except error.HTTPError as exc:
            retriable = exc.code == 429 or 500 <= exc.code < 600
            if retriable and attempt < max_retries:
                _sleep_backoff(attempt)
                continue
            raise RuntimeError(f"HTTP {exc.code}") from exc
        except (error.URLError, TimeoutError) as exc:
            if attempt < max_retries:
                _sleep_backoff(attempt)
                continue
            raise RuntimeError("network error") from exc

    raise RuntimeError("download failed after retries")


def _sleep_backoff(attempt: int) -> None:
    delay_s = min(8, 2**attempt)
    logging.warning("Transient photo download failure; retrying in %ss", delay_s)
    time.sleep(delay_s)


def _normalize_log_value(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        for item in value:
            normalized = _normalize_log_value(item)
            if normalized:
                return normalized
        return ""
    return str(value).strip()
