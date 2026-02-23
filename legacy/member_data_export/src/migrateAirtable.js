import AirtablePkg from "airtable";
import { config } from "./config.js";
import { initializeDatabase } from "./db.js";
import { deleteMembersNotInList, upsertMember } from "./members.js";

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

async function migrateFromAirtable() {
  ensureAirtableConfig();
  await initializeDatabase();

  const { apiKey, baseId, tableName, viewName } = config.airtable;
  const base = new Airtable({ apiKey }).base(baseId);
  const selectOptions = viewName ? { view: viewName } : undefined;
  const records = await base(tableName).select(selectOptions).all();
  const memberNumbers = [];

  for (const record of records) {
    const memberNumber = normalizeTextField(record.get("Member Number"));
    if (!memberNumber) {
      console.warn(`Skipping record ${record.id} - missing Member Number`);
      continue;
    }
    memberNumbers.push(memberNumber);

    const firstName = normalizeTextField(record.get("First Name"));
    const email = normalizeTextField(record.get("Email"));
    const tier = normalizeTextField(record.get("Membership Tier"));

    if (!firstName || !email) {
      console.warn(
        `Skipping ${memberNumber || record.id} - missing first name or email`
      );
      continue;
    }

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
      await upsertMember({
        member_number: memberNumber,
        first_name: firstName,
        email,
        tier,
        photo: photoBlob,
      });
      console.log(
        `Inserted member ${memberNumber || record.id}`
      );
    } catch (err) {
      console.error(
        `Failed to insert member ${memberNumber || record.id}:`,
        err.message
      );
    }
  }

  try {
    const result = await deleteMembersNotInList(memberNumbers);
    console.log(`Removed ${result.changes} stale members`);
  } catch (err) {
    console.error("Failed to remove stale members:", err.message);
  }
}

migrateFromAirtable().catch((err) => {
  console.error("Airtable migration failed:", err.message);
  process.exitCode = 1;
});
