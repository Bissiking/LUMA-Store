import { getApplication, listReleases } from "@/lib/store";
import { jsonError, noStoreJson } from "@/lib/http";
import { slugSchema } from "@/lib/validation";

export async function GET(_: Request, context: { params: Promise<{ slug: string }> }) {
  const parsed = slugSchema.safeParse((await context.params).slug);
  if (!parsed.success) return jsonError("Identifiant d'application invalide.", 400, "invalid_slug");
  const app = await getApplication(parsed.data);
  if (!app) return jsonError("Application introuvable.", 404, "not_found");
  return noStoreJson({ data: { ...app, releases: await listReleases(app.id) }, meta: { apiVersion: "v1" } });
}
