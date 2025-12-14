import sqlite3 from "sqlite3";
import { resolveDatabasePath } from "./config.js";

sqlite3.verbose();

let initialized = false;
let initializing;

function openDatabase() {
  const dbPath = resolveDatabasePath();
  return new sqlite3.Database(dbPath);
}

function runStatement(db, sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export async function initializeDatabase() {
  const db = openDatabase();
  try {
    await runStatement(
      db,
      `CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_number TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        email TEXT NOT NULL,
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
    initialized = true;
  } catch (error) {
    initializing = undefined;
    throw error;
  } finally {
    db.close();
  }
}

export async function getDatabase() {
  if (!initialized) {
    if (!initializing) {
      initializing = initializeDatabase();
    }
    await initializing;
  }

  return openDatabase();
}

export async function withDatabase(callback) {
  const db = await getDatabase();
  try {
    return await callback(db);
  } finally {
    db.close();
  }
}
