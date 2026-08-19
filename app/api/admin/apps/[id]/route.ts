import { getAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { applicationInput, uuidSchema } from "@/lib/validation";
import { jsonError, noStoreJson, requireSameOrigin } from "@/lib/http";
import { audit } from "@/lib/audit";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!requireSameOrigin(request)) return jsonError("Origine refusée.", 403, "origin_rejected");
  const admin = await getAdmin();
  if (!admin) return jsonError("Authentification requise.", 401, "unauthorized");
  const id = uuidSchema.safeParse((await context.params).id);
  const parsed = applicationInput.partial().safeParse(await request.json().catch(() => null));
  if (!id.success || !parsed.success || Object.keys(parsed.data).length === 0) return jsonError("Modification invalide.", 400, "validation_failed");
  const allowed: Record<string, string> = { name: "name", slug: "slug", summary: "summary", description: "description", publisher: "publisher", category: "category", iconUrl: "icon_url", websiteUrl: "website_url", repositoryUrl: "repository_url", isFeatured: "is_featured", status: "status" };
  const entries = Object.entries(parsed.data);
  const sets = entries.map(([key], index) => `${allowed[key]} = $${index + 1}`);
  const values = entries.map(([, value]) => value ?? null);
  values.push(id.data);
  const result = await query<{ id: string }>(`UPDATE applications SET ${sets.join(", ")}, updated_at = now() WHERE id = $${values.length} RETURNING id`, values);
  if (!result.rowCount) return jsonError("Application introuvable.", 404, "not_found");
  await audit(admin.id, "application.update", "application", id.data, { fields: entries.map(([key]) => key) });
  return noStoreJson({ data: { id: id.data } });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!requireSameOrigin(request)) return jsonError("Origine refusée.", 403, "origin_rejected");
  const admin = await getAdmin();
  if (!admin) return jsonError("Authentification requise.", 401, "unauthorized");
  const id = uuidSchema.safeParse((await context.params).id);
  if (!id.success) return jsonError("Application invalide.", 400, "validation_failed");
  const result = await query("UPDATE applications SET status = 'retired', updated_at = now() WHERE id = $1 RETURNING id", [id.data]);
  if (!result.rowCount) return jsonError("Application introuvable.", 404, "not_found");
  await audit(admin.id, "application.retire", "application", id.data);
  return noStoreJson({ data: { id: id.data, status: "retired" } });
}
