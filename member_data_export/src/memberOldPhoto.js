import AirtablePkg from "airtable";
import sqlite3 from "sqlite3";
import { config, resolveDatabasePath } from "./config.js";

const Airtable = AirtablePkg.default ?? AirtablePkg;
sqlite3.verbose();

const LAST_YEAR_FLAG_FIELD = "Use Last Year Photo";
const OLD_PHOTO_FIELD = "Old Photo";
const MEMBER_NUMBER_FIELD = "Member Number";
const FIRST_NAME_FIELD = "First Name";
const EMAIL_FIELD = "Email";
const TIER_FIELD = "Membership Tier";

function ensureAirtableConfig() {
  const { apiKey, baseId } = config.airtable;
  if (!apiKey || !baseId) {
    throw new Error(
      "Missing Airtable configuration. Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID."
    );
  }
}

function openLastYearDatabase() {
  const dbPath = resolveDatabasePath(config.lastYearDatabasePath);
  return new sqlite3.Database(dbPath);
}

function runStatement(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function runCallback(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

async function initializeLastYearDatabase(db) {
  await runStatement(
    db,
    `CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_number TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      email TEXT NOT NULL,
      tier TEXT NOT NULL,
      photo BLOB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  );
  await runStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_member_number ON members(member_number)"
  );
  await runStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_email ON members(email)"
  );
}

async function upsertLastYearMember(db, memberData) {
  const { member_number, first_name, email, tier, photo } = memberData;

  const sql = `INSERT INTO members (member_number, first_name, email, tier, photo)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(member_number) DO UPDATE SET
                 first_name = excluded.first_name,
                 email = excluded.email,
                 tier = excluded.tier,
                 photo = excluded.photo,
                 updated_at = CURRENT_TIMESTAMP`;

  return runStatement(db, sql, [
    member_number,
    first_name,
    email,
    tier,
    photo,
  ]);
}

async function fetchPhotoBlob(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download photo: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
}

function normalizeTextField(value) {
  if (value === undefined || value === null) return "";

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeTextField(item))
      .filter((v) => v !== "")
      .join(", ");
  }

  if (typeof value === "object") {
    if (value.name) return value.name.toString();
    if (value.email) return value.email.toString();
    if (value.id) return value.id.toString();
    if (value.tier) return value.tier.toString();
    return JSON.stringify(value);
  }

  return value.toString();
}

async function migrateLastYearPhotos() {
  ensureAirtableConfig();

  const db = openLastYearDatabase();
  try {
    await initializeLastYearDatabase(db);

    const { apiKey, baseId, tableName, viewName } = config.airtable;
    const lastYearViewName = config.lastYearAirtable.viewName || viewName;
    const base = new Airtable({ apiKey }).base(baseId);
    const selectOptions = {
      filterByFormula: `{${LAST_YEAR_FLAG_FIELD}}`,
    };
    if (lastYearViewName) {
      selectOptions.view = lastYearViewName;
    }

    const records = await base(tableName).select(selectOptions).all();

    console.log(`Found ${records.length} members using last year's photo`);

    for (const record of records) {
      const memberNumber = normalizeTextField(
        record.get(MEMBER_NUMBER_FIELD)
      );
      const firstName = normalizeTextField(record.get(FIRST_NAME_FIELD));
      const email = normalizeTextField(record.get(EMAIL_FIELD));
      const tier = normalizeTextField(record.get(TIER_FIELD));

      if (!memberNumber || !firstName || !email || !tier) {
        console.warn(
          `Skipping record ${record.id} - missing member number, first name, email, or tier`
        );
        continue;
      }

      const photoUrl = record.get(OLD_PHOTO_FIELD)?.[0]?.url;
      if (!photoUrl) {
        console.warn(`Skipping ${memberNumber} - missing old photo`);
        continue;
      }

      let photoBlob = null;
      try {
        photoBlob = await fetchPhotoBlob(photoUrl);
      } catch (err) {
        console.warn(
          `Skipping photo for member ${memberNumber}: ${err.message}`
        );
        continue;
      }

      await upsertLastYearMember(db, {
        member_number: memberNumber,
        first_name: firstName,
        email,
        tier,
        photo: photoBlob,
      });

      console.log(`Migrated: ${firstName} (${memberNumber})`);
    }
  } finally {
    db.close();
  }

  console.log("Migration complete");
}

migrateLastYearPhotos().catch((err) => {
  console.error("Last-year photo migration failed:", err.message);
  process.exitCode = 1;
});
