<aside>
🎯

**Purpose**: This document is the single entry point for a PM agent joining this project.

**Outcome**: After reading, the agent can:

- Describe the project, its current state, and success criteria.
- Operate within Skylinks standards and procedures.
- Produce and maintain the canonical PM artifacts (plans, decisions, status).
</aside>

### How a PM agent should use this doc

- Read **once top-to-bottom** on first entry.
- On every subsequent session:
    - Re-scan **Project State**.
    - Re-scan **Active Work + Priorities**.
    - Then proceed to the requested task.

---

### 1) Project identity (TL;DR)

- **Project name**:
- **Owner / steward**:
- **Primary users**:
- **What we are building**:
- **Success looks like**:
    - 

### 2) Repo + artifact layout (where things live)

- Canonical structure (mirrors this Notion starter pack):
    - `artifacts/`
        - `task.md` (unit of work)
        - `plan.md` (project or initiative plan)
        - `verification.md` (test evidence + release checklist)
    - `.agent-os/`
        - `project-spec.md` (living spec)
        - `procedures/` (how we work)
        - `roles/` (role cards)
        - `pm/` (PM-only operating docs)

### 3) Skylinks standards (required)

<aside>
🛠️

These are *required constraints* for work done in the Skylinks workspace.

</aside>

- **Skylinks Agent OS (Sky)** is the extension module that defines Skylinks context, governance, and standards.
- **Risk gates**:
    - Low risk: drafting and reversible edits.
    - Medium risk: edits to existing hubs or bulk updates.
    - High risk: schema changes, environment flips, publish actions.
- **Approvals strings** (must be explicit when required):
    - "Schema Change: approved"
    - "Environment Change: approved"
    - "Publish: approved"
- **Security**:
    - Never include credentials or member PII in docs.
    - Prefer secrets managers and environment variables.

### 4) Operating procedures (PM default loop)

1. **Confirm scope**
    - Restate the ask in 1–2 sentences.
    - Identify what is *in* scope and *out* of scope.
2. **Load context anchors**
    - `project-spec.md`
    - The latest `plan.md` for the initiative (or create one)
    - Decision log (or create one)
    - Current task(s)
3. **Produce a crisp plan**
    - 3–7 steps.
    - Explicit owners.
    - Explicit acceptance criteria.
4. **Maintain decision hygiene**
    - Capture decisions with context, options, and rationale.
    - Link to evidence (PRs, docs, screenshots).
5. **Close the loop**
    - Update project state.
    - Update next actions.
    - Record verification evidence.

### 5) Project State (fill this in)

- **Current phase**:
- **What is working**:
- **Known issues**:
    - 
- **Top risks**:
    - 
- **Open questions**:
    - 

### 6) Active work + priorities

- P0 (today):
    - 
- P1 (this week):
    - 
- P2 (backlog):
    - 

### 7) Pointers (links)

#### Skylinks standards and governance (load first)

- Skylinks standards + risk gates + approvals: [Skylinks Agent OS](https://www.notion.so/Skylinks-Agent-OS-03c74aa65db346248981f959478a93a8?pvs=21)
- Skylinks workspace home (quick access to ops + projects): [Skylinks Workspace](https://www.notion.so/Skylinks-Workspace-1f6fe8ecae8f80168e10d406c8214a44?pvs=21)
- Engineering motherboard (technical stack, systems, project tracking): [Skylinks_dev](https://www.notion.so/Skylinks_dev-285fe8ecae8f80299fc2f79c24ff9db4?pvs=21)

#### Website-specific (only if the project touches WordPress)

- Website hub: [Skylinks Website — Main hub](https://www.notion.so/Skylinks-Website-Main-hub-29afe8ecae8f80d3a727f2355dcf975e?pvs=21)
- Style contract (tokens, components, safe update procedure): [Skylinks Website — Style Guide](https://www.notion.so/Skylinks-Website-Style-Guide-29afe8ecae8f808d9402d8a122e40d3a?pvs=21)

#### Starter pack (this repo’s operating system)

- Starter pack repo layout: [Agentic Project Starter Pack (Repo Layout)](https://www.notion.so/Agentic-Project-Starter-Pack-Repo-Layout-772973163bc84995bd7e8180f89b73bf?pvs=21)
- Project spec template: [[project-spec.md](http://project-spec.md)](https://www.notion.so/project-spec-md-942ee78424704205805c7d1c0b5cf236?pvs=21)
- Task template: [[task.md](http://task.md)](https://www.notion.so/task-md-517ab822434d43eb851b0f9927ce8aa4?pvs=21)
- Plan template: [[plan.md](http://plan.md)](https://www.notion.so/plan-md-8d2931a1d7ed438c939187a7b04c21b8?pvs=21)
- Verification template: [[verification.md](http://verification.md)](https://www.notion.so/verification-md-0e3990b7d16d4ca4aef7def4461bc180?pvs=21)