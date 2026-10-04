import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pool } from "../lib/db";

const schema = await readFile(
  path.join(process.cwd(), "db", "schema.sql"),
  "utf8",
);
await pool.query(schema);
await pool.query(
  "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
);
for (const name of (await readdir(path.join(process.cwd(), "db", "migrations")))
  .filter((name) => name.endsWith(".sql"))
  .sort()) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("LOCK TABLE schema_migrations IN EXCLUSIVE MODE");
    if (
      !(
        await client.query("SELECT name FROM schema_migrations WHERE name=$1", [
          name,
        ])
      ).rowCount
    ) {
      await client.query(
        await readFile(
          path.join(process.cwd(), "db", "migrations", name),
          "utf8",
        ),
      );
      await client.query("INSERT INTO schema_migrations(name) VALUES($1)", [
        name,
      ]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
console.log("Schéma LUMA Store appliqué.");
await pool.end();
