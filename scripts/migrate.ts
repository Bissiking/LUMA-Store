import { readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "../lib/db";

const schema = await readFile(path.join(process.cwd(), "db", "schema.sql"), "utf8");
await pool.query(schema);
console.log("Schéma LUMA Store appliqué.");
await pool.end();
