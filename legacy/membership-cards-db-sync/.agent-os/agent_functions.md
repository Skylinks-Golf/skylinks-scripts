### How to “save up” + log decisions (Agent work journaling)

This starter pack assumes you want two things *in addition to code changes*:

- A **dev log entry** (what changed, why it changed, what to do next)
- A **decision trail** (what was decided, why, and what alternatives were rejected)

#### 1) Dev log entries (recommended: `artifacts/devlog/`)

**Goal:** After each meaningful chunk of work (a sprint, a PR, a deployment, or a multi-hour investigation), write one small log entry.

**Suggested repo location**

- `artifacts/devlog/<YYYYMMDD-HHMMSSZ>_<agent>.md`
- Examples:
    - `artifacts/devlog/20260214-235500Z_QAA.md`
    - `artifacts/devlog/20260214-235500Z_PM.md`

**Template (copy/paste)**

```markdown
Summary:

Details:
- 

Decisions:
- 

Blockers:
- None

Next Steps:
- 

Links:
- 
```

**Minimum bar (what “good” looks like)**

- 1–3 sentences in **Summary** that answer: “What changed and why does it matter?”
- Bullets in **Details** that are specific enough that you can reproduce the work.
- At least one bullet in **Decisions** if anything non-trivial happened.

#### 2) Decision logging (two layers)

**Layer A: Decision Log in `artifacts/task.md`**

- Use `artifacts/task.md` as the *canonical* per-task decision log. This is already listed as an expected section in the template.
- Add entries any time you:
    - Change scope
    - Change an interface or contract
    - Choose between two valid technical approaches
    - Accept risk or technical debt

**Recommended entry format**

- `YYYY-MM-DD` — **Decision**: …
    - **Rationale**: …
    - **Alternatives**: …
    - **Impact**: …
    - **Revisit when**: …

**Layer B: Dev log “Decisions” section (lightweight)**

- Mirror the *important* decisions into the dev log entry so the team can scan chronologically.
- The dev log should stay short. Prefer links back to `task.md` over long prose.

#### 3) “Save up” workflow (end-of-sprint consolidation)

Use this when you finish a discrete unit of work and want to consolidate artifacts.

**Save-up checklist**

1. Update `artifacts/task.md`
    - Close out acceptance criteria.
    - Append any new **Decision Log** entries.
    - Move resolved open questions into decisions or notes.
2. Update `artifacts/plan.md`
    - Mark milestone status.
    - Update dependencies and rollback notes if anything changed.
3. Create a new dev log entry under `artifacts/devlog/`
    - Capture Summary, Details, Decisions, Blockers, Next Steps.
4. Update `artifacts/verification.md`
    - Add evidence (test output, screenshots, curl output, links to runs).
    - List known issues and what is intentionally deferred.
5. (Optional) If your repo uses a hand-off log, append a hand-off note
    - Keep it 3–5 lines: deliverable, verification, and downstream expectations.

> Heuristic: If you cannot explain the change in **3 bullets**, you probably need to split it into multiple dev log entries.
>