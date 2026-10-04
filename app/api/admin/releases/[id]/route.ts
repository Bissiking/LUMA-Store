import { withdrawalError } from "@/lib/retention";
import type { Release } from "@/lib/types";
import { getAdmin } from "@/lib/auth";
import { config } from "@/lib/config";
import { query, transaction } from "@/lib/db";
import { jsonError, noStoreJson, requireSameOrigin } from "@/lib/http";
import { removeArtifact } from "@/lib/storage";
import { uuidSchema, releasePatchInput } from "@/lib/validation";
import { audit } from "@/lib/audit";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!requireSameOrigin(request))
    return jsonError("Origine refusée.", 403, "origin_rejected");
  const admin = await getAdmin();
  if (!admin)
    return jsonError("Authentification requise.", 401, "unauthorized");
  const id = uuidSchema.safeParse((await context.params).id);
  if (!id.success)
    return jsonError("Version invalide.", 400, "validation_failed");
  const outcome = await transaction(async (client) => {
    const target = await client.query<{ application_id: string }>(
      "SELECT application_id FROM releases WHERE id=$1",
      [id.data],
    );
    if (!target.rows[0]) return { error: "not_found" };
    const applicationId = target.rows[0].application_id;
    const app = await client.query<{ minimum_versions_to_keep: number | null }>(
      "SELECT minimum_versions_to_keep FROM applications WHERE id=$1 FOR UPDATE",
      [applicationId],
    );
    const minimum =
      app.rows[0]?.minimum_versions_to_keep ?? config.MIN_VERSIONS_TO_KEEP;
    const rows = await client.query<{
      id: string;
      version: string;
      status: Release["status"];
      channel: Release["channel"];
      is_protected: boolean;
      storage_key: string | null;
      published_at: Date | null;
    }>(
      "SELECT id,version,status,channel,is_protected,storage_key,published_at FROM releases WHERE application_id=$1 FOR UPDATE",
      [applicationId],
    );
    const releases = rows.rows.map((row) => ({
      ...row,
      isProtected: row.is_protected,
      publishedAt: row.published_at?.toISOString() ?? null,
    }));
    const error = withdrawalError(releases, id.data, minimum);
    if (error) return { error };
    const row = rows.rows.find((item) => item.id === id.data)!;
    if (row.status === "pending")
      await client.query("DELETE FROM releases WHERE id=$1", [id.data]);
    else
      await client.query(
        "UPDATE releases SET status='withdrawn',updated_at=now() WHERE id=$1",
        [id.data],
      );
    return { storageKey: row.storage_key, pending: row.status === "pending" };
  });
  if (outcome.error) {
    const errors: Record<string, string> = {
      not_found: "Version introuvable.",
      release_protected:
        "Cette version est protégée. Retirez d’abord sa protection.",
      current_version: "La version courante doit être conservée.",
      minimum_retention: "Le nombre minimal de versions doit être conservé.",
    };
    return jsonError(
      errors[outcome.error],
      outcome.error === "not_found" ? 404 : 409,
      outcome.error,
    );
  }
  await removeArtifact(outcome.storageKey ?? null);
  if (!outcome.pending)
    await query("UPDATE releases SET storage_key=NULL WHERE id=$1", [id.data]);
  await audit(
    admin.id,
    outcome.pending ? "release.cancel" : "release.withdraw",
    "release",
    id.data,
  );
  return noStoreJson({
    data: { id: id.data, status: outcome.pending ? "cancelled" : "withdrawn" },
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!requireSameOrigin(request))
    return jsonError("Origine refusée.", 403, "origin_rejected");
  const admin = await getAdmin();
  if (!admin)
    return jsonError("Authentification requise.", 401, "unauthorized");
  const id = uuidSchema.safeParse((await context.params).id);
  const parsed = releasePatchInput.safeParse(
    await request.json().catch(() => null),
  );
  if (!id.success || !parsed.success || !Object.keys(parsed.data).length)
    return jsonError("Modification invalide.", 400, "validation_failed");
  const columns: Record<string, string> = {
    version: "version",
    channel: "channel",
    platform: "platform",
    architecture: "architecture",
    packageType: "package_type",
    minimumOs: "minimum_os",
    releaseNotes: "release_notes",
    isProtected: "is_protected",
    isPublic: "is_public",
    distribution: "distribution",
  };
  const entries = Object.entries(parsed.data);
  try {
    const result = await query(
      `UPDATE releases SET ${entries.map(([key], index) => `${columns[key]}=$${index + 1}`).join(",")}, updated_at=now() WHERE id=$${entries.length + 1} AND status <> 'withdrawn' RETURNING id`,
      [...entries.map(([, value]) => value), id.data],
    );
    if (!result.rowCount)
      return jsonError("Version introuvable.", 404, "not_found");
  } catch (error) {
    if ((error as { code?: string }).code === "23505")
      return jsonError("Cette variante existe déjà.", 409, "release_conflict");
    throw error;
  }
  await audit(admin.id, "release.update", "release", id.data, {
    fields: entries.map(([key]) => key),
  });
  return noStoreJson({ data: { id: id.data, ...parsed.data } });
}
