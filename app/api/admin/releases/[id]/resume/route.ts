import { getAdmin } from "@/lib/auth";
import { randomToken, sha256 } from "@/lib/crypto";
import { query } from "@/lib/db";
import { jsonError, noStoreJson, requireSameOrigin } from "@/lib/http";
import { uuidSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!requireSameOrigin(request)) return jsonError("Origine refusée.", 403, "origin_rejected");
  const admin = await getAdmin();
  if (!admin) return jsonError("Authentification requise.", 401, "unauthorized");
  const id = uuidSchema.safeParse((await context.params).id);
  if (!id.success) return jsonError("Version invalide.", 400, "validation_failed");
  const result = await query("SELECT id FROM releases WHERE id=$1 AND status='pending'", [id.data]);
  if (!result.rowCount) return jsonError("Version en attente introuvable.", 404, "not_found");
  const uploadToken = randomToken(32);
  await query("UPDATE releases SET upload_token_hash=$1, upload_expires_at=now() + interval '30 minutes' WHERE id=$2", [sha256(uploadToken), id.data]);
  await audit(admin.id, "release.resume", "release", id.data);
  return noStoreJson({ data: { id: id.data, uploadToken, uploadUrl: `/api/admin/releases/${id.data}/binary` } });
}