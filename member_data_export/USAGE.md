# Member Data Export - Usage

## Prerequisites
- Node.js 18+ (built-in fetch support is required)
- SQLite runtime (pulled in via the sqlite3 package)

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create an environment file and adjust paths/keys:
   ```bash
   cp .env.example .env
   ```
   - `DATABASE_PATH`: where to write the SQLite file (relative paths are resolved from the working directory).
   - `SAMPLE_PHOTO` (optional): local path to a photo used by the demo script.
   - `AIRTABLE_*`: credentials and table settings for migration.

## Commands
- Initialize schema and indexes:
  ```bash
  npm run init-db
  ```
- Run a basic demo (insert + query):
  ```bash
  npm run demo
  ```
- Migrate from Airtable (requires API credentials):
  ```bash
  npm run migrate-airtable
  ```

## Code Pointers
- `src/db.js`: database initialization and connection helpers.
- `src/members.js`: CRUD operations, queries, and photo export helper.
- `src/photo.js`: read/write helpers for BLOB photo data.
- `src/migrateAirtable.js`: Airtable import script (downloads attachment BLOBs).
- `src/index.js`: demo flow for inserting and reading member data.
