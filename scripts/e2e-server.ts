import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { createHash } from "node:crypto";
import { readFile, mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";

// Isolated database and storage: this server never connects to the configured Store.
const db = await PGlite.create();
await db.exec(
  (await readFile("db/schema.sql", "utf8")).replace(
    "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
    "",
  ),
);
await db.exec(await readFile("db/migrations/001-store-ux.sql", "utf8"));
const storage = await mkdtemp(path.join(tmpdir(), "luma-store-e2e-"));
const appId = "00000000-0000-4000-8000-000000000001";
await db.query(
  "INSERT INTO applications(id,slug,name,summary,description,status,is_featured,supported_platforms) VALUES($1,'argos-test','Argos Test','Application isolée pour les tests du Store.','Description de test.','published',true,ARRAY['linux'])",
  [appId],
);
for (let i = 0; i < 7; i++) {
  const id = `00000000-0000-4000-8000-${String(i + 10).padStart(12, "0")}`;
  const key = `${appId}/${id}/argos.deb`;
  const bytes = Buffer.from("!<arch>\nfixture");
  await mkdir(path.join(storage, appId, id), { recursive: true });
  await writeFile(path.join(storage, key), bytes);
  await db.query(
    "INSERT INTO releases(id,application_id,version,channel,platform,architecture,package_type,status,file_name,original_file_name,storage_key,size_bytes,sha256,published_at,is_protected) VALUES($1,$2,$3,'stable','linux','x64','deb','published','argos.deb','argos-original.deb',$4,$5,$6,now(),$7)",
    [
      id,
      appId,
      `1.${i}.0`,
      key,
      bytes.length,
      createHash("sha256").update(bytes).digest("hex"),
      i === 4,
    ],
  );
}
const imageId = "00000000-0000-4000-8000-000000000100";
const imageKey = `${appId}/${imageId}/image.png`;
const image = await sharp({
  create: { width: 640, height: 400, channels: 3, background: "#ebebff" },
})
  .png()
  .toBuffer();
await mkdir(path.join(storage, appId, imageId), { recursive: true });
await writeFile(path.join(storage, imageKey), image);
await db.query(
  "INSERT INTO application_media(id,application_id,kind,storage_key,mime_type,width,height,size_bytes,sha256,caption) VALUES($1,$2,'screenshot',$3,'image/png',640,400,$4,$5,'Aperçu de test')",
  [
    imageId,
    appId,
    imageKey,
    image.length,
    createHash("sha256").update(image).digest("hex"),
  ],
);
await db.query(
  "INSERT INTO admin_sessions(id_hash,user_id,display_name,expires_at) VALUES($1,'e2e','Test',now()+interval '1 hour')",
  [createHash("sha256").update("isolated-e2e-session").digest("hex")],
);
const socket = new PGLiteSocketServer({
  db,
  host: "127.0.0.1",
  port: 55439,
  maxConnections: 20,
});
await socket.start();
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3100",
  ],
  {
    windowsHide: true,
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: "postgres://postgres:postgres@127.0.0.1:55439/postgres",
      DATABASE_SSL: "false",
      STORAGE_DIR: storage,
      PUBLIC_BASE_URL: "http://127.0.0.1:3100",
      SESSION_SECRET: "e2e-isolated-secret-with-at-least-32-characters",
      SESSION_ENCRYPTION_KEY:
        "e2e-isolated-encryption-with-at-least-32-characters",
    },
  },
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    child.kill();
    void socket
      .stop()
      .then(() => db.close())
      .finally(() => process.exit());
  });
child.on("exit", () => {
  void socket
    .stop()
    .then(() => db.close())
    .finally(() => process.exit());
});
