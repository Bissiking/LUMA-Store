import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { uuidSchema } from "@/lib/validation";
import { jsonError, noStoreJson, requireSameOrigin } from "@/lib/http";
import { removeArtifact } from "@/lib/storage";
import { audit } from "@/lib/audit";

const input = z
  .object({
    caption: z.string().trim().max(300).optional(),
    platform: z
      .enum(["windows", "macos", "linux", "android"])
      .nullable()
      .optional(),
    sortOrder: z.number().int().min(0).max(10000).optional(),
  })
  .strict();
async function mutate(
  request: Request,
  context: { params: Promise<{ id: string }> },
  deleting: boolean,
) {
  if (!requireSameOrigin(request))
    return jsonError("Origine refusée.", 403, "origin_rejected");
  const admin = await getAdmin();
  if (!admin)
    return jsonError("Authentification requise.", 401, "unauthorized");
  const id = uuidSchema.safeParse((await context.params).id);
  if (!id.success)
    return jsonError("Média invalide.", 400, "validation_failed");
  const parsed = deleting
    ? null
    : input.safeParse(await request.json().catch(() => null));
  if (!deleting && (!parsed?.success || !Object.keys(parsed.data).length))
    return jsonError("Modification invalide.", 400, "validation_failed");
  const columns: Record<string, string> = {
    caption: "caption",
    platform: "platform",
    sortOrder: "sort_order",
  };
  const entries = parsed?.success ? Object.entries(parsed.data) : [];
  const result = deleting
    ? await query<{ storage_key: string }>(
        "DELETE FROM application_media WHERE id=$1 RETURNING storage_key",
        [id.data],
      )
    : await query(
        `UPDATE application_media SET ${entries.map(([key], i) => `${columns[key]}=$${i + 1}`).join(",")} WHERE id=$${entries.length + 1} RETURNING id`,
        [...entries.map(([, value]) => value), id.data],
      );
  if (!result.rowCount)
    return jsonError("Média introuvable.", 404, "not_found");
  if (deleting)
    await removeArtifact(
      (result.rows[0] as { storage_key: string }).storage_key,
    );
  await audit(
    admin.id,
    deleting ? "media.delete" : "media.update",
    "media",
    id.data,
  );
  return noStoreJson({ data: { id: id.data } });
}
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return mutate(request, context, false);
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return mutate(request, context, true);
}
