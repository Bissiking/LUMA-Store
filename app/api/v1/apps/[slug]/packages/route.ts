import semver from "semver";
import { getApplication, listReleases } from "@/lib/store";
import { jsonError, noStoreJson } from "@/lib/http";
import { slugSchema } from "@/lib/validation";
import { config } from "@/lib/config";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (!rateLimit(`packages:${clientKey(request)}`, 60, 60_000).allowed) {
    return jsonError("Trop de requêtes.", 429, "rate_limited");
  }

  const slug = slugSchema.safeParse((await context.params).slug);
  if (!slug.success) return jsonError("Identifiant d'application invalide.", 400, "invalid_slug");

  const app = await getApplication(slug.data);
  if (!app) return jsonError("Application introuvable.", 404, "not_found");

  const releases = await listReleases(app.id);

  const packages = releases
    .filter((r) => r.status === "published" && semver.valid(semver.coerce(r.version)))
    .map((r) => ({
      version: r.version,
      channel: r.channel,
      platform: r.platform,
      architecture: r.architecture,
      packageType: r.packageType,
      minimumOs: r.minimumOs,
      fileName: r.fileName,
      sizeBytes: r.sizeBytes,
      sha256: r.sha256,
      publishedAt: r.publishedAt,
      downloadUrl: `${config.PUBLIC_BASE_URL}/api/v1/downloads/${r.id}`
    }))
    .sort((a, b) => semver.rcompare(semver.coerce(a.version)!, semver.coerce(b.version)!));

  return noStoreJson({
    data: { slug: app.slug, name: app.name, packages },
    meta: { count: packages.length, apiVersion: "v1" }
  });
}
