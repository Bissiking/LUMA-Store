import { getAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { applicationInput } from "@/lib/validation";
import { jsonError, noStoreJson, requireSameOrigin } from "@/lib/http";
import { audit } from "@/lib/audit";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) return jsonError("Origine refusée.", 403, "origin_rejected");
  const admin = await getAdmin();
  if (!admin) return jsonError("Authentification requise.", 401, "unauthorized");
  if (!rateLimit(`admin:${admin.id}`, 60, 60_000).allowed) return jsonError("Trop d'actions.", 429, "rate_limited");
  const parsed = applicationInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Données d'application invalides.", 400, "validation_failed");
  const value = parsed.data;
  try {
    const result = await query<{ id: string; slug: string }>(
      `INSERT INTO applications (name, slug, summary, description, publisher, category, icon_url, website_url, repository_url, is_featured, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id, slug`,
      [value.name, value.slug, value.summary, value.description, value.publisher, value.category, value.iconUrl ?? null, value.websiteUrl ?? null, value.repositoryUrl ?? null, value.isFeatured, value.status]
    );
    const app = result.rows[0];
    await audit(admin.id, "application.create", "application", app.id, { slug: app.slug }, clientKey(request));
    return noStoreJson({ data: app }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return jsonError("Ce slug existe déjà.", 409, "slug_conflict");
    throw error;
  }
}
