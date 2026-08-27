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

const connectionString = process.env.DATABASE_URL ?? "";

/** A URL pointing at this machine, rather than at Supabase. */
const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(connectionString);

/**
 * TLS settings for the connection.
 *
 * Local Postgres speaks plaintext over the loopback interface and has no
 * certificate to present, so TLS is off there. Supabase requires it.
 *
 * `rejectUnauthorized: false` encrypts the connection but does not verify who
 * is on the other end of it — enough to stop anyone reading the traffic, not
 * enough to prove the server is really Supabase. Set `DATABASE_CA_CERT` to
 * Supabase's certificate (Dashboard → Settings → Database → SSL certificate,
 * pasted as one line) to turn full verification on.
 */
const ssl = isLocal
  ? undefined
  : process.env.DATABASE_CA_CERT
    ? { ca: process.env.DATABASE_CA_CERT, rejectUnauthorized: true }
    : { rejectUnauthorized: false };

const globalForDb = globalThis as unknown as { pool: Pool | undefined };

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString,
    ssl,
    // Deliberately small. This is per developer, and a shared Supabase project
    // has one connection budget for the whole team — four people running `npm
    // run dev` at ten connections each is how everyone starts seeing "too many
    // clients". Dev also reloads the module tree constantly, so a stray pool
    // would otherwise keep its sockets.
    max: 5,
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
