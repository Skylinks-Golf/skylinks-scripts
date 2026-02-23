import { withDatabase } from "./db.js";
import { exportPhotoBlob } from "./photo.js";

const updatableFields = new Set([
  "member_number",
  "first_name",
  "email",
  "tier",
  "photo",
]);

function requireValue(value, field) {
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required field: ${field}`);
  }
}

function runGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function runAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
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

export async function insertMember(memberData) {
  const { member_number, first_name, email, tier, photo = null } = memberData;
  requireValue(member_number, "member_number");
  requireValue(first_name, "first_name");
  requireValue(email, "email");
  requireValue(tier, "tier");

  const sql = `INSERT INTO members (member_number, first_name, email, tier, photo)
               VALUES (?, ?, ?, ?, ?)`;

  return withDatabase((db) =>
    runStatement(db, sql, [member_number, first_name, email, tier, photo])
  );
}

export async function upsertMember(memberData) {
  const { member_number, first_name, email, tier, photo = null } = memberData;
  requireValue(member_number, "member_number");
  requireValue(first_name, "first_name");
  requireValue(email, "email");
  requireValue(tier, "tier");

  const sql = `INSERT INTO members (member_number, first_name, email, tier, photo)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(member_number) DO UPDATE SET
                 first_name = excluded.first_name,
                 email = excluded.email,
                 tier = excluded.tier,
                 photo = excluded.photo,
                 updated_at = CURRENT_TIMESTAMP`;

  return withDatabase((db) =>
    runStatement(db, sql, [member_number, first_name, email, tier, photo])
  );
}

export async function getMemberByNumber(memberNumber) {
  const sql = "SELECT * FROM members WHERE member_number = ?";
  return withDatabase((db) => runGet(db, sql, [memberNumber]));
}

export async function getAllMembers() {
  const sql = "SELECT * FROM members ORDER BY first_name";
  return withDatabase((db) => runAll(db, sql));
}

export async function updateMember(memberNumber, updates) {
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error("No updates provided.");
  }

  const invalidFields = Object.keys(updates).filter(
    (field) => !updatableFields.has(field)
  );
  if (invalidFields.length > 0) {
    throw new Error(`Invalid update fields: ${invalidFields.join(", ")}`);
  }

  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map((field) => `${field} = ?`).join(", ");

  const sql = `UPDATE members 
               SET ${setClause}, updated_at = CURRENT_TIMESTAMP
               WHERE member_number = ?`;

  return withDatabase((db) =>
    runStatement(db, sql, [...values, memberNumber])
  );
}

export async function exportPhoto(memberNumber, outputPath) {
  const sql = "SELECT photo FROM members WHERE member_number = ?";

  return withDatabase(async (db) => {
    const row = await runGet(db, sql, [memberNumber]);
    if (!row || !row.photo) {
      throw new Error("Photo not found");
    }

    return exportPhotoBlob(row.photo, outputPath);
  });
}

export async function deleteMembersNotInList(memberNumbers) {
  if (!Array.isArray(memberNumbers)) {
    throw new Error("memberNumbers must be an array.");
  }

  if (memberNumbers.length === 0) {
    return withDatabase((db) => runStatement(db, "DELETE FROM members"));
  }

  const placeholders = memberNumbers.map(() => "?").join(", ");
  const sql = `DELETE FROM members WHERE member_number NOT IN (${placeholders})`;

  return withDatabase((db) => runStatement(db, sql, memberNumbers));
}
