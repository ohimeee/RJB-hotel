// Runs a .sql file against DATABASE_URL. Stands in for `psql`, which is not on
// PATH in a plain Node/Windows setup.
//
//   node scripts/db.mjs db/schema.sql
import "dotenv/config";
import { readFileSync } from "node:fs";
import { Client } from "pg";

const file = process.argv[2];

if (!file) {
  console.error("Usage: node scripts/db.mjs <path-to-sql-file>");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env first.");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");
const client = new Client({ connectionString });

try {
  await client.connect();
  // One statement per file would defeat the point; node-postgres sends the
  // whole script as a single implicit transaction, so a failure rolls back.
  await client.query(sql);
  console.log(`Applied ${file}`);
} catch (error) {
  console.error(`Failed to apply ${file}:`);
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
