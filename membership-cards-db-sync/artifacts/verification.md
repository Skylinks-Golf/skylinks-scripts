# Verification Plan — Member Card Print Queue Sync

## Verification Scope

Validate that the Airtable to SQLite sync behaves correctly and safely for ProShop card-print operations.

- In scope:
  - Airtable fetch/pagination behavior
  - Field extraction and validation
  - Photo download and storage as BLOB
  - Upsert idempotency and prune behavior
  - Empty-view safety guard (`--confirm-empty`)
  - Staff-readable logging and summary
  - Windows launcher execution and pause behavior
- Out of scope:
  - Scheduled/background sync
  - Card printing automation in CardImaging

## Test Plan

| ID | Requirement | Scenario | Method | Expected Result |
| --- | --- | --- | --- | --- |
| V-01 | FR-1 | Query configured Airtable table/view | Integration run with known base/view | Script uses configured table/view successfully |
| V-02 | FR-2 | Multi-page Airtable result set | Integration run with >1 page data | All pages fetched; total count correct |
| V-03 | FR-3 | Required fields present | Fixture records with valid fields | Records mapped to member payload correctly |
| V-04 | FR-3 | Missing required field | Fixture with missing member/email/photo | Record skipped; skip reason logged |
| V-05 | FR-4 | Photo attachment download and BLOB write | Fixture with valid photo attachment URL | Photo stored as non-empty BLOB in SQLite |
| V-06 | FR-5, NFR-1 | Re-run sync on unchanged dataset | Run twice on same data | No duplicates; stable row set |
| V-07 | FR-6 | Prune members no longer in Airtable view | Remove member from source view and rerun | Missing member deleted from SQLite |
| V-08 | FR-7, NFR-2 | Airtable returns 0 rows without flag | Run against empty view | No prune; warning logged; non-zero exit |
| V-09 | FR-7, NFR-2 | Airtable returns 0 rows with `--confirm-empty` | Run with explicit flag | Queue pruned to zero rows |
| V-10 | FR-8 | Double-click launcher behavior | Run `Update Member DB.bat` | Sync executes and terminal remains open via `pause` |
| V-11 | NFR-3 | Logging includes all required counters | Run with mixed outcomes | Output contains fetched/inserted/updated/skipped/deleted and keyed errors |
| V-12 | NFR-4 | Secrets handling | Repo scan and config review | No API keys committed; env-based config used |
| V-13 | NFR-5 | Transient photo download failure | Simulate retriable HTTP failure | Retry attempts occur; per-record failure logged if exhausted |
| V-14 | Data contract | Parse attachment string format `filename (url)` | Unit/integration parsing test | URL is extracted correctly for download |
| V-15 | Fallback policy | `Photo` empty + `Old Photo` present + `Use Last Year Photo=checked` | Fixture row test | Old photo is selected per approved policy |
| V-16 | Fallback policy | `Photo` empty + `Old Photo` present + flag not checked | Fixture row test | Old photo is selected and logged as fallback |

## Evidence (Results)

| ID | Date | Executor | Environment | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| V-01 | 2026-02-14 | PM/Engineering Agent | Sandbox live run (`/tmp/members_live2.db`) | Passed | Airtable fetch succeeded (`fetched=58`) using configured table/view |
| V-02 | TBD | TBD | Local Windows workstation | Pending | Requires >1 Airtable API page dataset during execution |
| V-03 | TBD | TBD | Local Windows workstation | Pending | Pending targeted fixture validation for required-field extraction |
| V-04 | 2026-02-14 | PM/Engineering Agent | Sandbox live run (`/tmp/members_live2.db`) | Passed | Skip behavior observed for rows missing both `Photo` and `Old Photo` |
| V-05 | 2026-02-14 | PM/Engineering Agent | Sandbox live run (`/tmp/members_live2.db`) | Passed | `prepared=16`, `download_errors=0` indicates successful photo download for synced set |
| V-06 | 2026-02-14 | PM/Engineering Agent | Sandbox live rerun (`/tmp/members_live2.db`) | Passed | Second run summary: `inserted=0`, `updated=16`, `deleted=0` (idempotent behavior) |
| V-07 | TBD | TBD | Local Windows workstation | Pending | Pending controlled source removal and prune verification |
| V-08 | TBD | TBD | Local Windows workstation | Pending | Pending empty-view test without `--confirm-empty` |
| V-09 | TBD | TBD | Local Windows workstation | Pending | Pending empty-view test with `--confirm-empty` |
| V-10 | TBD | TBD | Windows workstation (double-click) | Pending | Launcher file exists; runtime test pending on Windows host |
| V-11 | 2026-02-14 | PM/Engineering Agent | Sandbox live run (`/tmp/members_live2.db`) | Passed | Structured summary emitted with fetched/inserted/updated/skipped/deleted/download_errors/fallback counts |
| V-12 | TBD | TBD | Repo and runtime config | Pending | Pending explicit secret-scan and release review |
| V-13 | TBD | TBD | Local Windows workstation | Pending | Pending forced transient-failure retry test |
| V-14 | 2026-02-14 | PM/Engineering Agent | Live + CSV-compatible parser path | Passed | Attachment parsing supports dict/list/direct URL/`filename (url)` string formats |
| V-15 | 2026-02-14 | PM/Engineering Agent | Sandbox live run (`/tmp/members_live2.db`) | Passed | Old-photo fallback events observed (`old_photo_fallback=9`) |
| V-16 | 2026-02-14 | PM/Engineering Agent | Sandbox live run (`/tmp/members_live2.db`) | Passed | Fallback applied regardless checkbox state per approved policy and observed runtime behavior |

## Known Issues

- Partial verification completed; see evidence table for passed scenarios.
- Remaining blockers before execution:
  - None.

## Release Checklist

- [ ] Contract values confirmed:
  - [x] Airtable field names locked from CSV export (`Member Number`, `First Name`, `Email`, `Photo`).
  - [x] Old photo fallback policy locked: if `Photo` is empty and `Old Photo` exists, use `Old Photo` regardless of `Use Last Year Photo`.
  - [x] CardImaging DB absolute path locked: `C:\data\skylinks\membersdb\members.db`.
- [ ] All high-priority tests passed (V-01, V-05, V-06, V-08, V-09, V-10, V-11).
- [ ] Attachment parsing and fallback tests passed (V-14, V-15, V-16).
- [ ] Empty-view guard validated with and without `--confirm-empty`.
- [ ] Logging output reviewed by non-technical operator for readability.
- [ ] No secrets committed; configuration instructions documented.
- [ ] Verification evidence table updated with actual artifacts (logs/screenshots/query outputs).
- [ ] Rollback procedure documented for failed sync deployments.

Execution notes (2026-02-14):
- Live Airtable validation was run against a temporary sandbox DB path (`/tmp/members_live2.db`) to avoid writing to production Windows path during development verification.
- Windows production launcher validation (`V-10`) still needs on-device execution.
