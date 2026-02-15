# Plan — Project Initialization

## Summary

Initialize the Member Card Print Queue Sync project to a ready-to-build state with clear scope, locked field contracts, executable task tracking, and verification readiness. This plan covers project initialization only, not implementation of sync logic.

- Initiative: Airtable to SQLite member-card queue sync
- PM Owner: Project Manager Agent
- Engineering Owner: Assigned dev operator
- Target Date: 2026-02-16

## Milestones

1. Initialization artifacts are completed and aligned.
2. Data and runtime contracts are confirmed.
3. Execution readiness is established (tasks, verification, risk controls).

## Work Breakdown

1. Confirm scope and acceptance criteria
- Owner: PM Agent
- Actions:
  - Restate in-scope/non-goals from `.agent-os/project-spec.md`.
  - Convert FR/NFR into an initialization-ready acceptance checklist.
- Acceptance Criteria:
  - Scope statement is explicit and implementation-neutral.
  - Acceptance checklist exists and maps to FR-1..FR-8 and NFR-1..NFR-5.

2. Create initial execution task artifact
- Owner: PM Agent
- Actions:
  - Populate `artifacts/task.md` with context, constraints, risks, and open questions.
  - Add initial decision log entries for unresolved assumptions.
- Acceptance Criteria:
  - `artifacts/task.md` contains all canonical sections.
  - Open questions in project spec are copied with owners and due dates.

3. Lock data contracts and environment assumptions
- Owner: Engineering Owner (with PM facilitation)
- Actions:
  - Confirm exact Airtable field names for member number and photo attachment.
  - Confirm workstation path for `members.db`.
  - Confirm CLI behavior for `--confirm-empty`.
- Acceptance Criteria:
  - Contract decisions recorded in task decision log.
  - No unresolved “must-confirm” contract items remain for implementation start.

4. Define verification readiness
- Owner: PM Agent + Engineering Owner
- Actions:
  - Populate `artifacts/verification.md` with test plan and evidence placeholders.
  - Add release checklist items for idempotency, prune safety, and logging requirements.
- Acceptance Criteria:
  - Verification artifact includes positive, negative, and edge-case tests.
  - Evidence placeholders are ready for test run outputs.

5. Establish implementation kickoff package
- Owner: PM Agent
- Actions:
  - Publish a short kickoff status in plan notes: current state, next actions, owners.
  - Sequence first implementation tasks and dependencies.
- Acceptance Criteria:
  - Next 3 executable implementation actions are assigned.
  - No ambiguity on who performs first code change.

## Dependencies

- Local runtime prerequisites (Python and dependencies) identified by engineering owner.

## Rollback Plan

This is a documentation-only initialization phase. If initialization artifacts become inconsistent:

1. Revert planning artifacts to last known-good git state.
2. Re-derive scope from `.agent-os/project-spec.md`.
3. Reconfirm open questions and decision records before resuming.

## Notes

- Risk classification during initialization: Low risk (documentation and planning updates only).
- No schema, environment, or publish approvals are requested in this phase.
- CSV-backed contract update (2026-02-14): required field names confirmed from `artifacts/airtable_schema.csv`.
- Windows DB path confirmed (2026-02-14): `C:\data\skylinks\membersdb\members.db`.
- Fallback policy confirmed (2026-02-14): when `Photo` is empty and `Old Photo` exists, use `Old Photo` regardless of checkbox state.
- Last-year-photo-reuse broader feature deferred beyond current implementation scope.

## Implementation Kickoff Package

Current state:
- PM/spec artifacts are aligned and no blocking open questions remain.

Next 3 executable actions:
1. Engineering Owner: Scaffold sync runner and config loading for Airtable/SQLite path contracts.
2. Engineering Owner: Implement Airtable fetch + field extraction + photo selection policy (`Photo` fallback to `Old Photo`) with structured logging.
3. Engineering Owner: Implement SQLite idempotent upsert + guarded prune (`--confirm-empty`) and add Windows launcher `Update Member DB.bat`.

Execution status (2026-02-14):
- Action 1 completed: Python scaffold created with CLI entrypoint, env-based config loading, and Windows DB path normalization to `C:\data\skylinks\membersdb\members.db`.
- Action 2 completed: Airtable pagination fetch, required-field extraction, `Photo`->`Old Photo` fallback selection, and structured skip/fallback summary logging implemented.
- Action 3 completed (implementation): SQLite idempotent upsert + guarded prune, photo download retries, and Windows launcher `Update Member DB.bat` added.
- Validation completed: live Airtable sync succeeded using `.env` credentials; second run confirmed idempotent updates (`inserted=0`, `updated=16`) in sandbox verification DB.
- Membership Tier adjustment completed: extraction + SQLite schema/upsert + migration-safe add-column path implemented and validated (`V-17`, `V-18`, `V-19`).

## Change Plan — Membership Tier

Objective:
- Extend sync contracts and storage to include Airtable `Membership Tier`.

Planned adjustment steps:
1. Data contract + parser update
- Owner: Engineering Owner
- Add `Membership Tier` extraction as a required field and include it in candidate payload.
- Acceptance: records with missing membership tier are skipped with explicit reason logging.

2. SQLite schema + upsert update
- Owner: Engineering Owner
- Add `membership_tier` column to `members` table and include it in upsert updates.
- Acceptance: new inserts and reruns persist/update `membership_tier` without breaking existing rows.

3. Migration/backward compatibility
- Owner: Engineering Owner
- Ensure existing databases are upgraded safely (e.g., add-column path) before writes.
- Acceptance: no runtime failure when running against pre-change DB files.

4. Verification update + execution
- Owner: PM Agent + Engineering Owner
- Add and run membership-tier test cases in `artifacts/verification.md`.
- Acceptance: extraction, persistence, and idempotent-update behavior for tier field are evidenced.

Risk notes:
- Medium risk: schema evolution on existing workstation DB files.
- Rollback: retain prior script version and DB backup before first tier-enabled production run.
