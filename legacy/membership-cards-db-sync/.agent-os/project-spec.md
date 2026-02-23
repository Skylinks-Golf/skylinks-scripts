# Project Spec — SWS — Member Card Print Queue Sync (Airtable → SQLite)

## 1) Overview

This project provides a **single-click** (double-click `.bat`) workflow for ProShop staff to refresh a local SQLite database (`members.db`) that CardImaging uses to print membership cards.

The script queries Airtable for members who are currently **awaiting their membership card**, downloads the member photo attachment, and syncs qualified records into SQLite.

## 2) Goals / Non-goals

### Goals

- Provide a **double-click** launcher (`Update Member DB.bat`) that refreshes the local CardImaging queue.
- Use Airtable as the **source of truth** for who is eligible for printing.
- Maintain a local SQLite DB compatible with CardImaging containing:
    - `member_number`
    - `first_name`
    - `email`
    - `membership_tier`
    - `photo` (BLOB)
- Ensure the sync is safe to run repeatedly:
    - idempotent upsert
    - prune (delete) rows no longer eligible
- Provide clear, staff-readable logging and a summary.

### Non-goals

- Not a continuous sync service or scheduled job.
- Not a CardImaging automation tool (only prepares the DB CardImaging reads).
- Not a replacement for Airtable data cleanup (eligibility is defined by the Airtable view).

## 3) Users and Use Cases

### Primary user types

- **ProShop staff**: needs an updated queue to print cards.
- **Admin/dev operator**: configures the script and troubleshoots issues.

### Key user stories

1. As ProShop staff, I want to double-click a file and refresh the card queue so that I can print all pending membership cards.
2. As an operator, I want safe reruns and clear logs so that I can trust the queue is accurate and troubleshoot quickly.

## 4) Requirements

### Functional requirements

FR-1. The program must query Airtable table `2026 Members - Lightspeed Tracking` using the view `Awaiting Membership Card`.

FR-2. The program must fetch all records from the Airtable view, handling pagination.

FR-3. For each Airtable record, the program must extract the required fields:

- Member Number
- First Name
- Email
- Membership Tier
- Photo attachment

FR-4. The program must download the photo attachment and store it in SQLite as a BLOB.

FR-5. The program must upsert records into SQLite keyed by `member_number`.

FR-6. The program must prune the SQLite table on non-empty runs by deleting rows whose `member_number` is not present in the Airtable view result set.

FR-7. The program must expose an explicit flag to allow “empty view = clear queue” behavior:

- `--confirm-empty` enables prune even when Airtable returns 0 rows.

FR-8. The program must provide a Windows launcher:

- `Update Member DB.bat`
- It must run the sync and then `pause` so staff can read the result.

### Non-functional requirements

NFR-1. Idempotency: running repeatedly must not create duplicates or inconsistent state.

NFR-2. Safety: if Airtable returns 0 records, the default behavior must **not** prune; instead it must warn and exit with a non-zero code (until `--confirm-empty` is provided).

NFR-3. Logging: output must include counts and key identifiers for errors.

- Airtable fetched count
- Inserted / updated / skipped counts
- Deleted count (pruned)
- Errors with Airtable record id (if available) and email/member number

NFR-4. Security: Airtable PAT and other secrets must not be committed.

NFR-5. Reliability: transient HTTP errors downloading photos should be retried a small number of times; failures should be logged per-record.

## 5) Interfaces and Contracts

### Airtable

**Inputs (configuration)**

- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_TABLE_NAME` (default: `2026 Members - Lightspeed Tracking`)
- `AIRTABLE_VIEW_NAME` (default: `Awaiting Membership Card`)

**Field mapping (confirmed from CSV export on 2026-02-14)**

- `Member Number` → `member_number`
- `First Name` → `first_name`
- `Email` → `email`
- `Membership Tier` → `membership_tier`
- `Photo` (attachment) → `photo_blob`

**Additional observed fields (policy-dependent usage)**

- `Old Photo` (attachment-like export string)
- `Use Last Year Photo` (`checked` or blank)

### SQLite (CardImaging consumption)

**Database file**

- `DATABASE_PATH` (default: `./members.db`)
- Windows production path (confirmed 2026-02-14): `C:\data\skylinks\membersdb\members.db`

**Table**: `members`

- `member_number` TEXT UNIQUE NOT NULL
- `first_name` TEXT NOT NULL
- `email` TEXT NOT NULL
- `membership_tier` TEXT NOT NULL
- `photo` BLOB
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

Recommended for debuggability (optional):

- `airtable_record_id` TEXT UNIQUE

## 6) Data Model (lightweight)

### Entity: Member (print-queue row)

- `member_number` (string, stable key)
- `first_name` (string)
- `email` (string)
- `membership_tier` (string)
- `photo` (binary blob)
- `updated_at` (timestamp)

## 7) Edge Cases

- Airtable view returns 0 rows:
    - default: warn, do not prune, exit non-zero
    - with `--confirm-empty`: prune to empty
- Record missing required fields:
    - skip record; log as “skipped (missing field)”
- Photo attachment missing or download fails:
    - skip record; log error; continue
- `Photo` empty and `Old Photo` present:
    - fallback to `Old Photo` even if `Use Last Year Photo` is not checked
- Airtable API rate limit / transient failure:
    - retry/backoff; fail run with clear message if unrecoverable

## 8) Out of Scope / Deferred

- Scheduled sync / background service.
- Multi-machine coordination (each workstation runs locally).
- Auto-updating Airtable based on print completion.
- “Last year photo reuse” as a separate feature toggle/workflow (deferred beyond current implementation).

## 9) Open Questions

- None at this time.

## 10) Change Log

- 2026-02-14: Initial project spec created from SWS feature documentation.
- 2026-02-14: Field names confirmed from `artifacts/airtable_schema.csv`; added `Old Photo` and `Use Last Year Photo` as observed fields and refined open questions.
- 2026-02-14: CardImaging DB path confirmed for Windows runtime: `C:\data\skylinks\membersdb\members.db`.
- 2026-02-14: Fallback policy confirmed: if `Photo` is empty and `Old Photo` exists, use `Old Photo` regardless of `Use Last Year Photo`.
- 2026-02-14: “Last year photo reuse” broader feature explicitly deferred to a future iteration.
- 2026-02-14: Scope adjusted to include Airtable field `Membership Tier` mapped to SQLite `membership_tier` based on updated CSV contract.

---

## Repo placement (for copy/paste)

- `.agent-os/project-spec.md` ← this document
- `artifacts/task.md` and `artifacts/plan.md` are maintained separately as execution artifacts.
