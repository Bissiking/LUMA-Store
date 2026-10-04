import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

it("migre les données existantes et conserve les variantes et médias", async () => {
  const db = new PGlite();
  try {
    const schema = (await readFile("db/schema.sql", "utf8")).replace(
      "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
      "",
    );
    await db.exec(schema);
    const appId = "00000000-0000-4000-8000-000000000001";
    await db.query(
      "INSERT INTO applications(id,slug,name,summary,icon_url,status) VALUES($1,'test','Test','Application existante','https://example.com/icon.png','published')",
      [appId],
    );
    await db.query(
      "INSERT INTO releases(application_id,version,platform,architecture,package_type,file_name,status) VALUES($1,'1.0.0','linux','arm64','rpm','app.rpm','published')",
      [appId],
    );
    await db.exec(await readFile("db/migrations/001-store-ux.sql", "utf8"));
    expect(
      (
        await db.query<{ original_file_name: string; is_public: boolean }>(
          "SELECT original_file_name,is_public FROM releases",
        )
      ).rows[0],
    ).toEqual({ original_file_name: "app.rpm", is_public: true });
    await db.query(
      "UPDATE applications SET status='hidden',supported_platforms=ARRAY['linux'] WHERE id=$1",
      [appId],
    );
    await db.query(
      "UPDATE releases SET architecture='x86',distribution='fc44',is_public=false",
    );
    await db.query(
      "INSERT INTO application_media(application_id,kind,storage_key,mime_type,width,height,size_bytes,sha256) VALUES($1,'icon','key','image/png',64,64,100,$2)",
      [appId, "a".repeat(64)],
    );
    expect(
      (
        await db.query<{ icon_url: string }>(
          "SELECT icon_url FROM applications",
        )
      ).rows[0].icon_url,
    ).toBe("https://example.com/icon.png");
    expect(
      (await db.query("SELECT * FROM application_media")).rows,
    ).toHaveLength(1);
  } finally {
    await db.close();
  }
}, 20_000);
