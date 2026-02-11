/**** Skylinks — Generate Monthly Event Blocks (Airtable Scripting App)
 * Table: "Event Blocks"
 * Fields:
 *  - Date (Date with time)               -> FIELD_DATE
 *  - Time Frame (Single select: AM | PM) -> FIELD_FRAME
 *  - Status (formula/self-managed)       -> FIELD_STATUS (not written)
 *  - Location (Single select: Skyroom | Event Tent) -> FIELD_LOCATION
 ****/

// ---------- Utility: exit from anywhere ----------
function exitScript(message) {
  // Throw a tagged error that we catch below to end the script cleanly
  throw new Error(`EXIT_SCRIPT::${message}`);
}

// ---------- Config (edit names if needed) ----------
const TABLE_NAME     = 'EventBlocks';
const FIELD_DATE     = 'Date';
const FIELD_FRAME    = 'Time Frame';
const FIELD_STATUS   = 'Status';          // not written
const FIELD_LOCATION = 'Location';

const BLOCKS = [
  { frame: 'AM', startHour: 10, endHour: 14 },
  { frame: 'PM', startHour: 16, endHour: 20 },
];

const LOCATIONS = ['Skyroom', 'Event Tent'];

// ---------- Helpers ----------
function parseMonth(input) {
  const m = String(input || '').trim();
  const mMatch = /^(\d{4})-(\d{2})$/.exec(m);
  if (!mMatch) return null;
  const year = Number(mMatch[1]);
  const month = Number(mMatch[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}
function daysInMonth(year, month1to12) {
  return new Date(year, month1to12, 0).getDate();
}
function makeLocalDate(year, month1to12, day, hour, minute = 0) {
  return new Date(year, month1to12 - 1, day, hour, minute, 0, 0);
}
function recordKey(dateStartLocal, frame, location) {
  const d = new Date(dateStartLocal);
  d.setSeconds(0, 0);
  return `${d.getTime()}|${frame}|${location}`;
}

// ---------- Script (top-level; no async wrapper) ----------
try {
  output.markdown(`# Generate Monthly Event Blocks`);

  const monthStr = await input.textAsync('Enter month (YYYY-MM), e.g. 2025-09:');
  const parsed = parseMonth(monthStr);
  if (!parsed) exitScript('❌ Invalid month. Use format YYYY-MM.');
  const { year, month } = parsed;
  const dim = daysInMonth(year, month);

  const table = base.getTable(TABLE_NAME);

  // Validate required fields exist
  const hasField = (name) => !!table.fields.find(f => f.name === name);
  if (!hasField(FIELD_DATE) || !hasField(FIELD_FRAME) || !hasField(FIELD_LOCATION)) {
    exitScript(`❌ Missing field(s). Need: "${FIELD_DATE}", "${FIELD_FRAME}", "${FIELD_LOCATION}".`);
  }

  // Validate single-select options exist
  const frameField = table.getField(FIELD_FRAME);
  const locationField = table.getField(FIELD_LOCATION);
  const frameChoices = (frameField.options?.choices || []).map(c => c.name);
  if (!(frameChoices.includes('AM') && frameChoices.includes('PM'))) {
    exitScript(`❌ "${FIELD_FRAME}" must have options "AM" and "PM".`);
  }
  const locChoices = (locationField.options?.choices || []).map(c => c.name);
  for (const req of LOCATIONS) {
    if (!locChoices.includes(req)) exitScript(`❌ "${FIELD_LOCATION}" is missing option "${req}".`);
  }

  // Scan existing for the month (avoid duplicates)
  output.text('Scanning existing records…');
  const query = await table.selectRecordsAsync({ fields: [FIELD_DATE, FIELD_FRAME, FIELD_LOCATION] });
  const existing = new Set();
  for (const rec of query.records) {
    const d = rec.getCellValue(FIELD_DATE);
    const f = rec.getCellValue(FIELD_FRAME)?.name;
    const l = rec.getCellValue(FIELD_LOCATION)?.name;
    if (d && f && l) {
      const key = recordKey(d, f, l);
      existing.add(key);
    }
  }

  // Build creates
  const toCreate = [];
  for (let day = 1; day <= dim; day++) {
    for (const loc of LOCATIONS) {
      for (const blk of BLOCKS) {
        const start = makeLocalDate(year, month, day, blk.startHour, 0);
        const key = recordKey(start, blk.frame, loc);
        if (existing.has(key)) continue; // skip duplicates
        toCreate.push({
          fields: {
            [FIELD_DATE]: start,
            [FIELD_FRAME]: { name: blk.frame },
            [FIELD_LOCATION]: { name: loc },
            // Status is formula/self-managed → do not write
          },
        });
      }
    }
  }

  if (toCreate.length === 0) {
    // Done—nothing new to add
    query.unloadData?.();
    exitScript(`No new blocks needed for ${monthStr} (all exist).`);
  }

  output.markdown(`**Will create ${toCreate.length} blocks** for ${monthStr}:
- Locations: ${LOCATIONS.join(', ')}
- Per day: ${LOCATIONS.length * BLOCKS.length} blocks
- Total days: ${dim}`);

  const proceed = await input.buttonsAsync('Proceed?', [
    { label: 'Create blocks', value: 'go' },
    { label: 'Cancel', value: 'stop' },
  ]);
  if (proceed !== 'go') {
    query.unloadData?.();
    exitScript('Cancelled.');
  }

  output.text('Creating records…');
  while (toCreate.length) {
    await table.createRecordsAsync(toCreate.splice(0, 50));
  }
  query.unloadData?.();
  output.markdown(`✅ Done. Blocks generated for **${monthStr}**.`);

} catch (err) {
  const msg = String(err?.message || err);
  if (msg.startsWith('EXIT_SCRIPT::')) {
    output.text(msg.replace('EXIT_SCRIPT::', ''));
  } else {
    output.text(`❌ Error: ${msg}`);
  }
}
