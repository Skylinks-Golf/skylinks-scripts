/**
 * Airtable > Skylinks at Buchanan Fields base > automations > Issue Tracker table
 */


const TABLE_NAME = "Issue Tracker";               // your table
const VIEW_NAME  = "Handyman";                    // adjust to match your schema
const DESC_FLD   = "Description";                 // adjust if needed
const DEPT_FLD   = "Department";                  // Single select or text
const STATUS_FLD = "Status";                      // optional
const PRIORITY_FLD = "Priority";                  // optional
const OPEN_STATUSES = new Set(["New","Open","Todo","Backlog"]); // tweak to your statuses

const ISSUE_TITLE = "Inspect Foam Plane – Front Entrance";
const ISSUE_DESC = [
  "Recurring 4-week inspection of the foam plane at the property front.",
  "Checklist:",
  "• Visual condition (cracks, chips, warping, discoloration)",
  "• Mounts/anchors secure and rust-free",
  "• Signage intact and legible",
  "• Clean debris; light wipe-down if dusty",
  "• Photo before/after; note any defects",
].join("\n");

/***** BUILD FIELD PAYLOAD *****/
// If Department is a single select, use {name:"Handyman"}; if text/multi-select, use "Handyman".
const departmentValue = { name: "Handyman" }; // <-- change to "Handyman" if your field is text

const fields = {
  [DESC_FLD]: ISSUE_DESC,
  [DEPT_FLD]: departmentValue,
  // Optional sensible defaults (comment out any that don't exist in your base)
  [STATUS_FLD]: { name: "New" },
  [PRIORITY_FLD]: { name: "Medium" },
  // You can also set a Due Date field if you have one, e.g. "Due": new Date().toISOString()
};

/***** DUPLICATE GUARD (last ~21 days) *****/
const table = base.getTable(TABLE_NAME);

// Pull minimal fields for check
const guardFields = [STATUS_FLD];
// if (CREATED_FLD) guardFields.push(CREATED_FLD);

const query = await table.selectRecordsAsync({ fields: guardFields });
const now = new Date();
const MS_21_DAYS = 21 * 24 * 60 * 60 * 1000;

const recentSameOpen = query.records.some(r => {
  // const sameTitle = (r.getCellValueAsString(TITLE_FLD) || "") === ISSUE_TITLE;
  const statusStr = STATUS_FLD ? r.getCellValueAsString(STATUS_FLD) : "New";
  const isOpen = OPEN_STATUSES.has(statusStr) || !STATUS_FLD;
  if (!isOpen) return false;

  // If you have a Created Time field, enforce “no duplicate within ~3 weeks”
  // if (CREATED_FLD) {
  //   const createdVal = r.getCellValue(CREATED_FLD);
  //   if (!createdVal) return false;
  //   const createdAt = new Date(createdVal);
  //   return (now - createdAt) < MS_21_DAYS;
  // }
  return false; // if no Created field, skip time-based guard
});

if (recentSameOpen) {
  output.markdown("ℹ️ Skipped: Recent open foam-plane inspection exists (within ~3 weeks).");
  return;
}

/***** CREATE RECORD *****/
const recId = await table.createRecordAsync(fields);
output.markdown(`✅ Created Handyman issue **${ISSUE_TITLE}** (record ${recId}).`);

/***** OPTIONAL: VERIFY IT HITS THE VIEW *****/
// We do not use a title for the issues, instead they are given autonumbers by Airtable upon creation.
// Not required, but helpful to catch filter mismatches during testing.
// try {
//   const view = base.getTable(TABLE_NAME).getView(VIEW_NAME);
//   const inView = (await view.selectRecordsAsync({ fields: [TITLE_FLD] }))
//     .records.some(r => r.id === recId);
//   if (!inView) {
//     output.markdown(`⚠️ Note: New record did **not** appear in view "${VIEW_NAME}". Check the view filters (Department, Status, etc.).`);
//   }
// } catch {
//   // If the view name doesn't exist, ignore silently
// }