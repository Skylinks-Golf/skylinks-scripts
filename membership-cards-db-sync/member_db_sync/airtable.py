from __future__ import annotations

import json
import logging
import re
import time
from dataclasses import dataclass
from typing import Any
from urllib import error, parse, request

from .config import AppConfig


FIELD_MEMBER_NUMBER = "Member Number"
FIELD_FIRST_NAME = "First Name"
FIELD_EMAIL = "Email"
FIELD_MEMBERSHIP_TIER = "Membership Tier"
FIELD_PHOTO = "Photo"
FIELD_OLD_PHOTO = "Old Photo"

_CSV_ATTACHMENT_URL_RE = re.compile(r"\((https?://[^)]+)\)\s*$")


@dataclass(frozen=True)
class MemberCandidate:
    airtable_record_id: str
    member_number: str
    first_name: str
    email: str
    membership_tier: str
    photo_url: str
    used_old_photo_fallback: bool


def fetch_airtable_records(config: AppConfig, max_retries: int = 3, timeout_s: int = 30) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    offset: str | None = None

    while True:
        response_json = _airtable_list_records_page(
            config=config,
            offset=offset,
            max_retries=max_retries,
            timeout_s=timeout_s,
        )
        page_records = response_json.get("records", [])
        if not isinstance(page_records, list):
            raise ValueError("Unexpected Airtable response format: 'records' is not a list.")
        records.extend(page_records)
        offset = response_json.get("offset")
        if not offset:
            break

    return records


def build_member_candidate(record: dict[str, Any]) -> tuple[MemberCandidate | None, str | None]:
    record_id = _clean_str(record.get("id"))
    fields = record.get("fields")
    if not isinstance(fields, dict):
        return None, "missing_fields_object"

    member_number = _clean_str(fields.get(FIELD_MEMBER_NUMBER))
    first_name = _clean_str(fields.get(FIELD_FIRST_NAME))
    email = _clean_str(fields.get(FIELD_EMAIL))
    membership_tier = _clean_str(fields.get(FIELD_MEMBERSHIP_TIER))

    if not member_number:
        return None, "missing_member_number"
    if not first_name:
        return None, "missing_first_name"
    if not email:
        return None, "missing_email"
    if not membership_tier:
        return None, "missing_membership_tier"

    primary_photo_url = _extract_attachment_url(fields.get(FIELD_PHOTO))
    old_photo_url = _extract_attachment_url(fields.get(FIELD_OLD_PHOTO))

    photo_url = primary_photo_url or old_photo_url
    if not photo_url:
        return None, "missing_photo_and_old_photo"

    used_old_photo_fallback = bool(old_photo_url and not primary_photo_url)
    candidate = MemberCandidate(
        airtable_record_id=record_id or "unknown_record_id",
        member_number=member_number,
        first_name=first_name,
        email=email,
        membership_tier=membership_tier,
        photo_url=photo_url,
        used_old_photo_fallback=used_old_photo_fallback,
    )
    return candidate, None


def _airtable_list_records_page(
    config: AppConfig,
    offset: str | None,
    max_retries: int,
    timeout_s: int,
) -> dict[str, Any]:
    encoded_table_name = parse.quote(config.airtable_table_name, safe="")
    url = f"https://api.airtable.com/v0/{config.airtable_base_id}/{encoded_table_name}"
    params = {"view": config.airtable_view_name, "pageSize": "100"}
    if offset:
        params["offset"] = offset
    full_url = f"{url}?{parse.urlencode(params)}"

    headers = {"Authorization": f"Bearer {config.airtable_api_key}"}

    for attempt in range(max_retries + 1):
        req = request.Request(full_url, method="GET", headers=headers)
        try:
            with request.urlopen(req, timeout=timeout_s) as response:
                payload = response.read().decode("utf-8")
                data = json.loads(payload)
                if not isinstance(data, dict):
                    raise ValueError("Unexpected Airtable response format.")
                return data
        except error.HTTPError as exc:
            is_retriable = exc.code == 429 or 500 <= exc.code < 600
            if is_retriable and attempt < max_retries:
                _sleep_backoff(attempt)
                continue
            raise RuntimeError(f"Airtable API request failed with HTTP {exc.code}.") from exc
        except error.URLError as exc:
            if attempt < max_retries:
                _sleep_backoff(attempt)
                continue
            raise RuntimeError("Airtable API request failed due to network error.") from exc

    raise RuntimeError("Airtable API request failed after retries.")


def _sleep_backoff(attempt: int) -> None:
    delay_s = min(8, 2**attempt)
    logging.warning("Transient Airtable API failure; retrying in %ss", delay_s)
    time.sleep(delay_s)


def _extract_attachment_url(value: Any) -> str | None:
    if value is None:
        return None

    if isinstance(value, list):
        for item in value:
            extracted = _extract_attachment_url(item)
            if extracted:
                return extracted
        return None

    if isinstance(value, dict):
        return _clean_str(value.get("url"))

    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return None
        if raw.startswith("http://") or raw.startswith("https://"):
            return raw
        match = _CSV_ATTACHMENT_URL_RE.search(raw)
        if match:
            return match.group(1).strip()
        return None

    return None


def _clean_str(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        for item in value:
            cleaned = _clean_str(item)
            if cleaned:
                return cleaned
        return ""
    if isinstance(value, str):
        return value.strip()
    return str(value).strip()
