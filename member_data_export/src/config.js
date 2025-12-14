import dotenv from "dotenv";
import path from "path";

dotenv.config();

const defaultDbPath = "./members.db";

export const config = {
  databasePath: process.env.DATABASE_PATH || defaultDbPath,
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY || "",
    baseId: process.env.AIRTABLE_BASE_ID || "",
    tableName: process.env.AIRTABLE_TABLE_NAME || "Members",
  },
};

export function resolveDatabasePath() {
  if (path.isAbsolute(config.databasePath)) {
    return config.databasePath;
  }

  return path.join(process.cwd(), config.databasePath);
}
