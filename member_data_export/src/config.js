import dotenv from "dotenv";
import path from "path";

dotenv.config();

const defaultDbPath = "./members.db";
const defaultLastYearDbPath = "./members_last_year.db";

export const config = {
  databasePath: process.env.DATABASE_PATH || defaultDbPath,
  lastYearDatabasePath:
    process.env.LAST_YEAR_DATABASE_PATH || defaultLastYearDbPath,
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY || "",
    baseId: process.env.AIRTABLE_BASE_ID || "",
    tableName: process.env.AIRTABLE_TABLE_NAME || "Members",
    viewName: process.env.AIRTABLE_VIEW_NAME || "",
  },
  lastYearAirtable: {
    viewName: process.env.LAST_YEAR_AIRTABLE_VIEW_NAME || "",
  },
};

export function resolveDatabasePath(databasePath = config.databasePath) {
  if (path.isAbsolute(databasePath)) {
    return databasePath;
  }

  return path.join(process.cwd(), databasePath);
}
