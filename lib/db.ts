import { Pool, type QueryResultRow } from "pg";
import { config } from "@/lib/config";

const globalForDb = globalThis as unknown as { lumaPool?: Pool };

export function normalizeDatabaseUrl(connectionString: string) {
  const url = new URL(connectionString);
  if (url.hostname === "localhost") url.hostname = "127.0.0.1";
  return url.toString();
}

export const pool = globalForDb.lumaPool ?? new Pool({
  connectionString: normalizeDatabaseUrl(config.DATABASE_URL),
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: config.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined
});

if (!config.isProduction) globalForDb.lumaPool = pool;

type DatabaseError = Error & { code?: string };

export function normalizeDatabaseError(error: unknown): DatabaseError {
  if (!(error instanceof AggregateError)) {
    return error instanceof Error ? error : new Error("Erreur PostgreSQL inconnue.");
  }

  const nestedErrors = Array.isArray(error.errors) ? error.errors : [];
  const firstError = nestedErrors.find((nested): nested is DatabaseError => nested instanceof Error);
  const normalized: DatabaseError = new Error(
    firstError?.message || error.message || "Connexion PostgreSQL indisponible."
  );
  normalized.name = "DatabaseError";
  if (firstError?.code) normalized.code = firstError.code;
  return normalized;
}

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  try {
    return await pool.query<T>(text, values);
  } catch (error) {
    throw normalizeDatabaseError(error);
  }
}

export async function transaction<T>(work: (client: import("pg").PoolClient) => Promise<T>) {
  let client: import("pg").PoolClient;
  try {
    client = await pool.connect();
  } catch (error) {
    throw normalizeDatabaseError(error);
  }
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
