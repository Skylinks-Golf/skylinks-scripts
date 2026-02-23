# Repository Guidelines

## Project Structure & Module Organization
- `airtable/` stores Airtable automations; nest domain-specific flows under folders such as `airtable/events/` or `airtable/skylinks/`, and keep table/field configs at the top of each file.
- `google_apps_script/` contains Workspace automations with single entry points (`doGet`, `main`, etc.) so the files can be pasted straight into the Apps Script editor.
- `memberships/airtable_photo_fetch/` is the scratchpad for membership tooling; graduate anything reusable into the folders above once it stabilizes.

## Build, Test, and Development Commands
Scripts run in Airtable or Google Apps Script, so rely on lightweight local checks before pasting code.
- `npx prettier "airtable/**/*.js" "google_apps_script/**/*.js" --check` enforces the two-space, semicolon style (add `--write` for auto-fixes).
- `node --check google_apps_script/fetchEventBlocks.js` (swap in your file) to catch syntax errors ahead of the Apps Script editor.
- `rg -n "base.getTable" airtable` confirms every table/view reference was updated when cloning a workflow.

## Coding Style & Naming Conventions
Favor modern JavaScript with two-space indentation and `const`/`let`. Keep config constants (table names, select options, API URLs) in uppercase `SCREAMING_SNAKE_CASE` blocks at the top. Name files descriptively with lowercase words and underscores (`auto_monthly_issue.js`, `snagMemberPhotoFromEmail.js`), and push reusable helpers (e.g., `exitScript`, `removeCake`) out of the main flow.

## Testing Guidelines
For Airtable scripts, duplicate the base, retarget `TABLE_NAME`/`VIEW_NAME` to sandbox tables, and iterate with the Automation “Test” button until logs confirm the right records. For Google Apps Script, deploy a test Web App (or run functions directly), use the debugger, and log reduced payloads before touching live sheets. Document any manual steps or data prerequisites in comments or in `memberships/airtable_photo_fetch/README`.

## Commit & Pull Request Guidelines
Commits are short, lower-case, and imperative (`add more scripts`, `airtable scirpts`). Keep that tone but include the scope (`airtable: add foam-plane inspection script`) so history stays searchable. PRs should outline the change, the test surface (sandbox link or Apps Script screenshots), and any follow-up configuration (new Airtable view, Script Property, etc.), plus issue links and required secrets.

## Security & Configuration Tips
Do not hard-code production credentials; move items such as `AIRTABLE_API_KEY` into Airtable automations or Apps Script Properties before committing. Check only sanitized data into version control, keep temporary CSVs in ignored paths, and call out permission or secret requirements in every PR so maintainers can provision them during rollout.
