from __future__ import annotations

import os
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class MemberRow:
    member_number: str
    first_name: str
    email: str
    membership_tier: str
    photo: bytes
    airtable_record_id: str


@dataclass(frozen=True)
class SyncResult:
    inserted: int
    updated: int
    deleted: int


def sync_members(database_path: str, members: list[MemberRow], allow_empty_prune: bool) -> SyncResult:
    _ensure_parent_dir(database_path)
    connection = sqlite3.connect(database_path)
    try:
        _ensure_schema(connection)
        inserted = 0
        updated = 0

        incoming_member_numbers = [m.member_number for m in members]
        now_utc = _now_utc()

        for member in members:
            existing = connection.execute(
                "SELECT 1 FROM members WHERE member_number = ? LIMIT 1",
                (member.member_number,),
            ).fetchone()
            if existing:
                updated += 1
            else:
                inserted += 1

            connection.execute(
                """
                INSERT INTO members (
                    member_number,
                    first_name,
                    email,
                    membership_tier,
                    photo,
                    airtable_record_id,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(member_number) DO UPDATE SET
                    first_name = excluded.first_name,
                    email = excluded.email,
                    membership_tier = excluded.membership_tier,
                    photo = excluded.photo,
                    airtable_record_id = excluded.airtable_record_id,
                    updated_at = excluded.updated_at
                """,
                (
                    member.member_number,
                    member.first_name,
                    member.email,
                    member.membership_tier,
                    member.photo,
                    member.airtable_record_id,
                    now_utc,
                    now_utc,
                ),
            )

        deleted = _prune_members(
            connection=connection,
            incoming_member_numbers=incoming_member_numbers,
            allow_empty_prune=allow_empty_prune,
        )
        connection.commit()
        return SyncResult(inserted=inserted, updated=updated, deleted=deleted)
    finally:
        connection.close()


def _ensure_schema(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS members (
            member_number TEXT UNIQUE NOT NULL,
            first_name TEXT NOT NULL,
            email TEXT NOT NULL,
            membership_tier TEXT NOT NULL DEFAULT '',
            photo BLOB,
            airtable_record_id TEXT UNIQUE,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    _ensure_membership_tier_column(connection)


def _prune_members(
    connection: sqlite3.Connection,
    incoming_member_numbers: list[str],
    allow_empty_prune: bool,
) -> int:
    if not incoming_member_numbers and not allow_empty_prune:
        return 0

    if not incoming_member_numbers and allow_empty_prune:
        cursor = connection.execute("DELETE FROM members")
        return int(cursor.rowcount if cursor.rowcount is not None else 0)

    placeholders = ",".join("?" for _ in incoming_member_numbers)
    query = f"DELETE FROM members WHERE member_number NOT IN ({placeholders})"
    cursor = connection.execute(query, tuple(incoming_member_numbers))
    return int(cursor.rowcount if cursor.rowcount is not None else 0)


def _now_utc() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _ensure_membership_tier_column(connection: sqlite3.Connection) -> None:
    columns = connection.execute("PRAGMA table_info(members)").fetchall()
    has_membership_tier = any(column[1] == "membership_tier" for column in columns)
    if has_membership_tier:
        return
    connection.execute(
        "ALTER TABLE members ADD COLUMN membership_tier TEXT NOT NULL DEFAULT ''"
    )


def _ensure_parent_dir(database_path: str) -> None:
    parent = os.path.dirname(database_path)
    if parent:
        try:
            os.makedirs(parent, exist_ok=True)
        except OSError as exc:
            raise RuntimeError(
                f"Failed to create/access database directory '{parent}'. Check path and permissions."
            ) from exc
