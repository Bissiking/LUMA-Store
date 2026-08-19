import { getAdmin } from "@/lib/auth";
import { config } from "@/lib/config";
import { query } from "@/lib/db";
import { jsonError, noStoreJson, requireSameOrigin } from "@/lib/http";
import { removeArtifact } from "@/lib/storage";
import { uuidSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!requireSameOrigin(request)) return jsonError("Origine refusée.", 403, "origin_rejected");
  const admin = await getAdmin();
  if (!admin) return jsonError("Authentification requise.", 401, "unauthorized");
  const id = uuidSchema.safeParse((await context.params).id);
  if (!id.success) return jsonError("Version invalide.", 400, "validation_failed");
  const release = await query<{ application_id: string; storage_key: string | null; is_protected: boolean }>("SELECT application_id, storage_key, is_protected FROM releases WHERE id=$1", [id.data]);
  const row = release.rows[0];
  if (!row) return jsonError("Version introuvable.", 404, "not_found");
  if (row.is_protected) return jsonError("Cette version est protégée. Retirez d'abord sa protection.", 409, "release_protected");
  const count = await query<{ count: string }>("SELECT count(*) FROM releases WHERE application_id=$1 AND status='published'", [row.application_id]);
  if (Number(count.rows[0].count) <= config.MIN_VERSIONS_TO_KEEP) return jsonError(`Au moins ${config.MIN_VERSIONS_TO_KEEP} versions doivent être conservées.`, 409, "minimum_retention");
  await query("UPDATE releases SET status='withdrawn' WHERE id=$1", [id.data]);
  await removeArtifact(row.storage_key);
  await query("UPDATE releases SET storage_key=NULL WHERE id=$1", [id.data]);
  await audit(admin.id, "release.withdraw", "release", id.data);
  return noStoreJson({ data: { id: id.data, status: "withdrawn" } });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!requireSameOrigin(request)) return jsonError("Origine refusée.", 403, "origin_rejected");
  const admin = await getAdmin();
  if (!admin) return jsonError("Authentification requise.", 401, "unauthorized");
  const id = uuidSchema.safeParse((await context.params).id);
  const body = await request.json().catch(() => null) as { isProtected?: unknown } | null;
  if (!id.success || typeof body?.isProtected !== "boolean") return jsonError("Modification invalide.", 400, "validation_failed");
  const result = await query("UPDATE releases SET is_protected=$1 WHERE id=$2 RETURNING id", [body.isProtected, id.data]);
  if (!result.rowCount) return jsonError("Version introuvable.", 404, "not_found");
  await audit(admin.id, body.isProtected ? "release.protect" : "release.unprotect", "release", id.data);
  return noStoreJson({ data: { id: id.data, isProtected: body.isProtected } });
}
