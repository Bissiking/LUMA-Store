import { Pool, type QueryResultRow } from "pg";
import { config } from "@/lib/config";

const globalForDb = globalThis as unknown as { lumaPool?: Pool };

export const pool = globalForDb.lumaPool ?? new Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: config.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined
});

if (!config.isProduction) globalForDb.lumaPool = pool;

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  return pool.query<T>(text, values);
}

export async function transaction<T>(work: (client: import("pg").PoolClient) => Promise<T>) {
  const client = await pool.connect();
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
