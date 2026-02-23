import { initializeDatabase } from "./db.js";
import { resolveDatabasePath } from "./config.js";

async function main() {
  await initializeDatabase();
  console.log(`Database ready at ${resolveDatabasePath()}`);
}

main().catch((err) => {
  console.error("Failed to initialize database:", err.message);
  process.exitCode = 1;
});
