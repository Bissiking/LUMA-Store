import { getAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { releaseInput } from "@/lib/validation";
import { jsonError, noStoreJson, requireSameOrigin } from "@/lib/http";
import { randomToken, sha256 } from "@/lib/crypto";
import { audit } from "@/lib/audit";

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) return jsonError("Origine refusée.", 403, "origin_rejected");
  const admin = await getAdmin();
  if (!admin) return jsonError("Authentification requise.", 401, "unauthorized");
  const adminId = admin.id;
  const parsed = releaseInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Données de version invalides.", 400, "validation_failed");
  const value = parsed.data;
  const uploadToken = randomToken(32);

  async function createRelease() {
    const result = await query<{ id: string }>(
      `INSERT INTO releases (application_id, version, channel, platform, architecture, package_type, minimum_os, release_notes, is_protected, upload_token_hash, upload_expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now() + interval '30 minutes') RETURNING id`,
      [value.applicationId, value.version, value.channel, value.platform, value.architecture, value.packageType, value.minimumOs ?? null, value.releaseNotes, value.isProtected, sha256(uploadToken)]
    );
    await audit(adminId, "release.create_pending", "release", result.rows[0].id, { version: value.version, platform: value.platform });
    return noStoreJson({ data: { id: result.rows[0].id, uploadToken, uploadUrl: `/api/admin/releases/${result.rows[0].id}/binary` } }, { status: 201 });
  }

  try {
    return await createRelease();
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      await query(
        `DELETE FROM releases WHERE status='pending' AND upload_expires_at < now()
         AND application_id=$1 AND version=$2 AND channel=$3 AND platform=$4 AND architecture=$5 AND package_type=$6`,
        [value.applicationId, value.version, value.channel, value.platform, value.architecture, value.packageType]
      );
      try {
        return await createRelease();
      } catch (retryError) {
        if ((retryError as { code?: string }).code === "23505") return jsonError("Cette variante de version existe déjà.", 409, "release_conflict");
        throw retryError;
      }
    }
    throw error;
  }
}
