import fs from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { query } from "@/lib/db";
import { artifactPath } from "@/lib/storage";
import { jsonError } from "@/lib/http";
import { uuidSchema } from "@/lib/validation";
import { rateLimit, clientKey } from "@/lib/rate-limit";

type Artifact = { storage_key: string; file_name: string; mime_type: string | null; sha256: string; size_bytes: string };

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!rateLimit(`download:${clientKey(request)}`, 60, 60_000).allowed) return jsonError("Trop de téléchargements.", 429, "rate_limited");
  const id = uuidSchema.safeParse((await context.params).id);
  if (!id.success) return jsonError("Artefact invalide.", 400, "invalid_artifact");
  const result = await query<Artifact>("SELECT storage_key, file_name, mime_type, sha256, size_bytes FROM releases WHERE id = $1 AND status = 'published' AND storage_key IS NOT NULL", [id.data]);
  const artifact = result.rows[0];
  if (!artifact) return jsonError("Artefact introuvable.", 404, "not_found");
  const filePath = artifactPath(artifact.storage_key);
  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat?.isFile()) return jsonError("Fichier temporairement indisponible.", 503, "artifact_unavailable");
  const total = fileStat.size;
  const range = request.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  let start = 0, end = total - 1, status = 200;
  if (range) {
    start = range[1] ? Number(range[1]) : 0;
    end = range[2] ? Math.min(Number(range[2]), total - 1) : total - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= total) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
    }
    status = 206;
  }
  const headers = new Headers({
    "Content-Type": artifact.mime_type || "application/octet-stream",
    "Content-Length": String(end - start + 1),
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(artifact.file_name)}`,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600, immutable",
    "X-Checksum-SHA256": artifact.sha256
  });
  if (status === 206) headers.set("Content-Range", `bytes ${start}-${end}/${total}`);
  return new Response(Readable.toWeb(fs.createReadStream(filePath, { start, end })) as ReadableStream, { status, headers });
}
