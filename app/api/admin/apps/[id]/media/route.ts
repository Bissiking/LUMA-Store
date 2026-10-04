import { randomUUID, createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { readFile, rename, unlink } from "node:fs/promises";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import sharp from "sharp";
import { getAdmin } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import { jsonError, noStoreJson, requireSameOrigin } from "@/lib/http";
import { uuidSchema } from "@/lib/validation";
import { prepareArtifactPath, removeArtifact } from "@/lib/storage";
import { listMedia } from "@/lib/media";
import { audit } from "@/lib/audit";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!requireSameOrigin(request))
    return jsonError("Origine refusée.", 403, "origin_rejected");
  const admin = await getAdmin();
  if (!admin)
    return jsonError("Authentification requise.", 401, "unauthorized");
  const appId = uuidSchema.safeParse((await context.params).id);
  const kind = new URL(request.url).searchParams.get("kind");
  const mime = request.headers.get("content-type");
  const length = Number(request.headers.get("content-length"));
  if (
    !appId.success ||
    !["icon", "screenshot"].includes(kind ?? "") ||
    !["image/png", "image/webp"].includes(mime ?? "") ||
    !request.body
  )
    return jsonError("Image PNG ou WEBP requise.", 400, "invalid_media");
  if (!Number.isSafeInteger(length) || length < 1 || length > 10 * 1024 ** 2)
    return jsonError("Image limitée à 10 Mo.", 413, "file_too_large");
  if (
    !(await query("SELECT id FROM applications WHERE id=$1", [appId.data]))
      .rowCount
  )
    return jsonError("Application introuvable.", 404, "not_found");
  const id = randomUUID();
  const paths = await prepareArtifactPath(
    appId.data,
    id,
    mime === "image/png" ? "image.png" : "image.webp",
  );
  let received = 0;
  let committed = false;
  let oldKey: string | null = null;
  try {
    await pipeline(
      Readable.fromWeb(
        request.body as import("node:stream/web").ReadableStream,
      ),
      new Transform({
        transform(chunk, _encoding, callback) {
          received += chunk.length;
          callback(
            received > 10 * 1024 ** 2
              ? new Error("Image trop volumineuse.")
              : null,
            chunk,
          );
        },
      }),
      createWriteStream(paths.tempPath, { flags: "wx", mode: 0o640 }),
    );
    if (received !== length) throw new Error("Taille de fichier incorrecte.");
    const bytes = await readFile(paths.tempPath);
    const image = sharp(bytes, { limitInputPixels: 40_000_000 });
    const metadata = await image.metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      (metadata.pages && metadata.pages > 1) ||
      metadata.format !== (mime === "image/png" ? "png" : "webp")
    )
      throw new Error("Image invalide ou animée.");
    await image.stats();
    await rename(paths.tempPath, paths.finalPath);
    await transaction(async (client) => {
      await client.query("SELECT id FROM applications WHERE id=$1 FOR UPDATE", [
        appId.data,
      ]);
      if (kind === "icon") {
        const old = await client.query<{ storage_key: string }>(
          "DELETE FROM application_media WHERE application_id=$1 AND kind='icon' RETURNING storage_key",
          [appId.data],
        );
        oldKey = old.rows[0]?.storage_key ?? null;
      }
      await client.query(
        "INSERT INTO application_media(id,application_id,kind,storage_key,mime_type,width,height,size_bytes,sha256,sort_order) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,(SELECT COALESCE(max(sort_order),-1)+1 FROM application_media WHERE application_id=$2))",
        [
          id,
          appId.data,
          kind,
          paths.storageKey,
          mime,
          metadata.width,
          metadata.height,
          received,
          createHash("sha256").update(bytes).digest("hex"),
        ],
      );
      await client.query(
        "UPDATE applications SET updated_at=now(),icon_managed=CASE WHEN $2='icon' THEN true ELSE icon_managed END WHERE id=$1",
        [appId.data, kind],
      );
    });
    committed = true;
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Upload impossible.",
      400,
      "invalid_media",
    );
  } finally {
    await unlink(paths.tempPath).catch(() => {});
    if (!committed) await removeArtifact(paths.storageKey);
  }
  await removeArtifact(oldKey);
  await audit(admin.id, "media.upload", "application", appId.data, {
    mediaId: id,
    kind,
  });
  return noStoreJson({ data: await listMedia(appId.data) }, { status: 201 });
}
