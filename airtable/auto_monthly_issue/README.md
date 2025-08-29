Used Airtable’s scheduled trigger with Weekly → every 4 weeks, which matches a 28-day cadence better than “Monthly.”

Script sets the key fields so it lands in your Handyman view (Department = Handyman, sensible defaults).

Included a light duplicate guard (checks for an open, same-title issue created in the last ~3 weeks when a Created-Time field is available) so test runs don’t spam.

**Alternatives / Trade-offs**

State table guard (most robust): Create a 1-row table “Automation State” with fields: Name (e.g., foam_plane_inspection) and Last Run (date). Script reads Last Run and only creates a new issue if now - Last Run >= 28 days, then updates Last Run. This is bulletproof across schedule changes or manual test runs.

Exact 28-day scheduling: If your workspace UI doesn’t expose “Repeat every: 4 weeks,” use Weekly (every 1 week) and enable the state guard above to fire only when ≥28 days have passed.

Single-select vs text: If Department is text, set "Handyman" directly. If it’s a linked record, you’ll need to look up the “Handyman” record ID and set [{id}].

Richer defaults: Add fields like Source: Automation, Assigned To, or a Due Date (e.g., TODAY()+3) to tighten your workflow.

Actionable Next Steps

Create/confirm fields in Issue Tracker:

Title (single line text), Description (long text), Department (single select with “Handyman”), Status (single select with “New”), optional Priority, optional Created (field type Created time).

Ensure your Handyman view filters match (e.g., Department = Handyman, Status != Completed).

Automations → Create automation → At a scheduled time

Weekly → Repeat every: 4 weeks, pick day/time (e.g., Mondays 8:00 AM PT).

Add action → Run script → paste the code above.

If your Department is text, change departmentValue to "Handyman".

Test once, confirm the record shows in the Handyman view, then Turn on.

If you prefer the state-table version for perfect 28-day spacing, say the word and I’ll drop in the variant that reads/updates Last Run in an “Automation State” table.