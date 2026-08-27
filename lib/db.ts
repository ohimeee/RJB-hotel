import { Pool, types } from "pg";

// DATE columns are calendar days, not instants. Left alone, node-postgres turns
// them into Dates in the server's local zone, which shifts a booking by one day
// for anyone west of Greenwich. Hand them over as the `YYYY-MM-DD` strings the
// rest of the app already speaks — see lib/dates.ts.
const DATE_OID = 1082;
types.setTypeParser(DATE_OID, (value) => value);

// NUMERIC already arrives as a string, and that is deliberate: parsing pesos
// into a float would reintroduce the rounding error lib/money.ts exists to
// avoid. Do not add a parser for it.

const globalForDb = globalThis as unknown as { pool: Pool | undefined };

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Dev reloads the module tree constantly; a small ceiling keeps a stray
    // pool from exhausting local Postgres connections.
    max: 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

/**
 * Every read and write goes through here. Values are always passed as `$1`
 * parameters — never interpolated into the SQL string — so user input cannot
 * change the shape of a query.
 */
export const query = async <T>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> => {
  const result = await pool.query(text, params);
  return result.rows as T[];
};

/** First row, or null. For lookups by primary key. */
export const queryOne = async <T>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> => {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
};
