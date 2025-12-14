import AirtablePkg from "airtable";
import { config } from "./config.js";
import { initializeDatabase } from "./db.js";
import { insertMember } from "./members.js";

const Airtable = AirtablePkg.default ?? AirtablePkg;

function ensureAirtableConfig() {
  const { apiKey, baseId } = config.airtable;
  if (!apiKey || !baseId) {
    throw new Error(
      "Missing Airtable configuration. Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID."
    );
  }
}

async function fetchPhotoBlob(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download photo: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
}

async function migrateFromAirtable() {
  ensureAirtableConfig();
  await initializeDatabase();

  const { apiKey, baseId, tableName } = config.airtable;
  const base = new Airtable({ apiKey }).base(baseId);
  const records = await base(tableName).select().all();

  for (const record of records) {
    const photoUrl = record.get("Photo")?.[0]?.url;
    let photoBlob = null;

    if (photoUrl) {
      try {
        photoBlob = await fetchPhotoBlob(photoUrl);
      } catch (err) {
        console.warn(
          `Skipping photo for member ${record.id}: ${err.message}`
        );
      }
    }

    try {
      await insertMember({
        member_number: record.get("Member Number"),
        first_name: record.get("First Name"),
        email: record.get("Email"),
        photo: photoBlob,
      });
      console.log(
        `Inserted member ${record.get("Member Number") || record.id}`
      );
    } catch (err) {
      console.error(
        `Failed to insert member ${record.get("Member Number") || record.id}:`,
        err.message
      );
    }
  }
}

migrateFromAirtable().catch((err) => {
  console.error("Airtable migration failed:", err.message);
  process.exitCode = 1;
});
