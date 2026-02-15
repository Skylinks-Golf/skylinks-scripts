# Task — Project Initialization

## Context

This task initializes project management artifacts for the Member Card Print Queue Sync project defined in `.agent-os/project-spec.md`. The objective is to make the project implementation-ready with explicit scope, criteria, ownership, and verification structure.

CSV review completed on 2026-02-14 using `artifacts/airtable_schema.csv` (58 rows, 14 columns in latest export). Required fields are present with exact names: `Member Number`, `First Name`, `Email`, `Membership Tier`, `Photo`. Additional relevant fields discovered: `Old Photo` and `Use Last Year Photo`.

## Goals

- Translate project spec requirements into executable PM artifacts.
- Make implementation entry conditions explicit.
- Capture open decisions and ownership before code implementation begins.

## Non-goals

- Implement sync code or batch launcher behavior.
- Approve schema/environment/publish operations.
- Resolve external dependencies without assigned owner confirmation.

## Scope

- In scope:
  - Define initialization acceptance criteria mapped to FR/NFR.
  - Record risks, constraints, and open questions.
  - Establish decision log and ownership for unresolved contract items.
  - Prepare verification structure and release-readiness placeholders.
- Out of scope:
  - Any source code modifications outside planning artifacts.
  - Any production execution or data migration.

## Acceptance Criteria

1. FR/NFR traceability is explicit in planning artifacts.
2. `artifacts/plan.md`, `artifacts/task.md`, and `artifacts/verification.md` are no longer placeholders.
3. Open questions from project spec have owners and target dates.
4. Risk level and approval posture are documented per Skylinks standards.
5. Implementation kickoff can begin without ambiguity on first actions.

## Acceptance Criteria Status (Save-up 2026-02-15)

- AC-1: Completed
- AC-2: Completed
- AC-3: Completed (open questions resolved or formally deferred)
- AC-4: Completed
- AC-5: Completed (implementation actions executed through tier adjustment)

## Constraints

- Must follow Skylinks PM guardrails:
  - Do not request/store secrets or PII.
  - Do not approve schema/environment/publish changes.
- Use Airtable as source of truth for queue eligibility.
- Preserve safety requirement for empty-view behavior (`--confirm-empty` required to clear queue).

## Risks

- Contract ambiguity risk:
  - CSV-confirmed field names could drift from live Airtable schema over time.
  - Impact: Runtime mapping failures if schema changes after export.
- Runtime path risk:
  - Path is confirmed, but deployment may fail if local folder permissions or existence differ per workstation.
  - Impact: Sync run fails or writes to unintended location.
- Operational safety risk:
  - Misconfigured empty-view handling could unintentionally clear queue.
  - Impact: Printing backlog disruption.
- Reliability risk:
  - Photo download transient failures may degrade data completeness.
  - Impact: Skipped members and manual re-run overhead.
- Data-shape risk:
  - Attachment values are exported as `filename (url)` strings and may require parsing.
  - Impact: Incorrect URL extraction could cause photo download failures.
- Data-quality risk:
  - Fallback behavior is now defined to use `Old Photo` when `Photo` is empty; risk remains if `Old Photo` formatting is invalid.
  - Impact: Invalid old-photo payloads may still cause per-record skips.
- Schema-change risk:
  - Adding `membership_tier` to existing SQLite `members` table requires migration-safe logic.
  - Impact: Existing workstation DBs could fail sync until schema is upgraded.

## Open Questions

- None at this time.

## Decision Log

| Date | Owner | Decision | Status | Rationale |
| --- | --- | --- | --- | --- |
| 2026-02-14 | PM Agent | Initialization artifacts are completed before implementation starts. | Decided | Reduces execution ambiguity and prevents requirement drift. |
| 2026-02-14 | PM Agent | Empty Airtable result does not prune by default; explicit `--confirm-empty` required. | Decided | Safety guardrail aligned with NFR-2. |
| 2026-02-14 | PM Agent | CSV review confirms field names: `Member Number`, `First Name`, `Email`, `Photo`; optional `Old Photo`, `Use Last Year Photo`. | Decided | Exported schema evidence resolves primary field-name contract risk. |
| 2026-02-14 | PM Agent | Windows DB path confirmed: `C:\data\skylinks\membersdb\members.db`. | Decided | User-provided runtime contract for production execution. |
| 2026-02-14 | PM Agent | Fallback policy confirmed: if `Photo` is empty and `Old Photo` exists, use `Old Photo` regardless of `Use Last Year Photo` value. | Decided | User-provided policy closes fallback ambiguity and unblocks implementation. |
| 2026-02-14 | PM Agent | “Last year photo reuse” broader feature deferred beyond current implementation scope. | Decided | Keeps v1 focused on deterministic queue sync behavior. |
| 2026-02-14 | PM Agent | Scope adjustment approved: include Airtable `Membership Tier` in extraction and SQLite sync. | Decided | Updated CSV confirms field availability across all rows and operational need. |
| 2026-02-14 | Engineering Agent | SQLite sync now auto-creates the DB directory before connect. | Decided | Resolved runtime error `unable to open database file` on Windows systems where target path did not yet exist. |
| 2026-02-14 | Engineering Agent | Photo download now falls back to `Old Photo` if primary `Photo` download fails and old photo URL exists. | Decided | Addresses real-world case where both photo fields exist but primary URL is broken/expired. |
