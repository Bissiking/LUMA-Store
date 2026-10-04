import { createHash, randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { rename, rm } from "node:fs/promises";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { getAdmin } from "@/lib/auth";
import { config } from "@/lib/config";
import { timingSafeEqual, sha256 } from "@/lib/crypto";
import { query, transaction } from "@/lib/db";
import { jsonError, noStoreJson, requireSameOrigin } from "@/lib/http";
import { prepareArtifactPath } from "@/lib/storage";
import {
  uuidSchema,
  validateArtifactMagic,
  validateArtifactName,
} from "@/lib/validation";
import { detectRelease } from "@/lib/release-detection";
import { audit } from "@/lib/audit";

type Pending = {
  id: string;
  application_id: string;
  package_type: string;
  upload_token_hash: string;
  upload_expires_at: Date;
};

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!requireSameOrigin(request))
    return jsonError("Origine refusée.", 403, "origin_rejected");
  const admin = await getAdmin();
  if (!admin)
    return jsonError("Authentification requise.", 401, "unauthorized");
  const id = uuidSchema.safeParse((await context.params).id);
  const token = request.headers.get("x-upload-token") ?? "";
  const fileNameHeader = request.headers.get("x-file-name") ?? "";
  const length = Number(request.headers.get("content-length") ?? 0);
  if (!id.success || !token || !request.body)
    return jsonError("Téléversement invalide.", 400, "invalid_upload");
  if (
    !Number.isSafeInteger(length) ||
    length <= 0 ||
    length > config.MAX_ARTIFACT_SIZE_BYTES
  )
    return jsonError("Taille de fichier refusée.", 413, "file_too_large");
  const result = await query<Pending>(
    "SELECT id, application_id, package_type, upload_token_hash, upload_expires_at FROM releases WHERE id = $1 AND status = 'pending'",
    [id.data],
  );
  const pending = result.rows[0];
  if (
    !pending ||
    pending.upload_expires_at < new Date() ||
    !timingSafeEqual(pending.upload_token_hash, sha256(token))
  )
    return jsonError(
      "Jeton d'upload invalide ou expiré.",
      403,
      "invalid_upload_token",
    );
  let fileName: string;
  try {
    fileName = validateArtifactName(
      decodeURIComponent(fileNameHeader),
      pending.package_type,
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Nom invalide.",
      400,
      "invalid_filename",
    );
  }
  const detected = detectRelease(decodeURIComponent(fileNameHeader));
  const paths = await prepareArtifactPath(
    pending.application_id,
    pending.id,
    fileName,
  );
  paths.tempPath = `${paths.finalPath}.${randomUUID()}.uploading`;
  let moved = false;
  let published = false;
  const hash = createHash("sha256");
  let received = 0;
  let header = Buffer.alloc(0);
  const limiter = new Transform({
    transform(chunk, _encoding, callback) {
      received += chunk.length;
      if (received > config.MAX_ARTIFACT_SIZE_BYTES)
        return callback(new Error("FILE_TOO_LARGE"));
      if (header.length < 16)
        header = Buffer.concat([header, chunk]).subarray(0, 16);
      hash.update(chunk);
      callback(null, chunk);
    },
  });
  try {
    await pipeline(
      Readable.fromWeb(
        request.body as import("node:stream/web").ReadableStream,
      ),
      limiter,
      createWriteStream(paths.tempPath, { flags: "wx", mode: 0o640 }),
    );
    if (received !== length) throw new Error("SIZE_MISMATCH");
    if (!validateArtifactMagic(header, pending.package_type))
      throw new Error("SIGNATURE_MISMATCH");
    const digest = hash.digest("hex");
    await transaction(async (client) => {
      await client.query("SELECT id FROM applications WHERE id=$1 FOR UPDATE", [
        pending.application_id,
      ]);
      const current = await client.query<Pending & { status: string }>(
        "SELECT * FROM releases WHERE id=$1 FOR UPDATE",
        [pending.id],
      );
      const row = current.rows[0];
      if (
        !row ||
        row.status !== "pending" ||
        row.package_type !== pending.package_type ||
        !row.upload_token_hash ||
        row.upload_expires_at < new Date() ||
        !timingSafeEqual(row.upload_token_hash, sha256(token))
      )
        throw new Error("UPLOAD_CONFLICT");
      await rename(paths.tempPath, paths.finalPath);
      moved = true;
      await client.query(
        `UPDATE releases SET file_name=$1, storage_key=$2, mime_type=$3, size_bytes=$4, sha256=$5, status='published', published_at=now(), upload_token_hash=NULL, upload_expires_at=NULL, original_file_name=$7, detected_version_raw=$8, detected_architecture_raw=$9, detected_package_raw=$10, detected_distribution_raw=$11, updated_at=now() WHERE id=$6`,
        [
          fileName,
          paths.storageKey,
          request.headers.get("content-type") || "application/octet-stream",
          received,
          digest,
          pending.id,
          detected.originalFileName,
          detected.detectedVersionRaw,
          detected.detectedArchitectureRaw,
          detected.detectedPackageRaw,
          detected.detectedDistributionRaw,
        ],
      );
      await client.query(
        "UPDATE applications SET updated_at=now() WHERE id=$1",
        [pending.application_id],
      );
    });
    published = true;
    await audit(admin.id, "release.publish", "release", pending.id, {
      fileName,
      sizeBytes: received,
      sha256: digest,
    });
    return noStoreJson({
      data: {
        id: pending.id,
        fileName,
        sizeBytes: received,
        sha256: digest,
        status: "published",
      },
    });
  } catch (error) {
    await rm(paths.tempPath, { force: true });
    if (moved && !published) await rm(paths.finalPath, { force: true });
    const code = error instanceof Error ? error.message : "UPLOAD_FAILED";
    return jsonError(
      code === "FILE_TOO_LARGE"
        ? "Fichier trop volumineux."
        : "Le téléversement a échoué.",
      code === "FILE_TOO_LARGE" ? 413 : 400,
      code.toLowerCase(),
    );
  }
}
