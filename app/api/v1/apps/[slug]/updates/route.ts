import { z } from "zod";
import { getApplication, listReleases, selectUpdate } from "@/lib/store";
import { jsonError, noStoreJson } from "@/lib/http";
import { slugSchema } from "@/lib/validation";
import { config } from "@/lib/config";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const updateQuery = z.object({
  current_version: z.string().min(1).max(64),
  platform: z.enum(["windows", "macos", "linux", "android"]),
  arch: z.enum(["x64", "arm64", "universal"]).default("universal"),
  channel: z.enum(["stable", "beta", "nightly"]).default("stable")
});

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (!rateLimit(`updates:${clientKey(request)}`, 300, 60_000).allowed) return jsonError("Trop de requêtes.", 429, "rate_limited");
  const slug = slugSchema.safeParse((await context.params).slug);
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = updateQuery.safeParse(params);
  if (!slug.success || !parsed.success) return jsonError("Paramètres de mise à jour invalides.", 400, "invalid_parameters");
  const app = await getApplication(slug.data);
  if (!app) return jsonError("Application introuvable.", 404, "not_found");
  const release = selectUpdate(await listReleases(app.id), parsed.data.current_version, parsed.data.platform, parsed.data.arch, parsed.data.channel);
  if (!release) return noStoreJson({ data: { available: false, currentVersion: parsed.data.current_version }, meta: { apiVersion: "v1" } });
  return noStoreJson({
    data: {
      available: true,
      currentVersion: parsed.data.current_version,
      version: release.version,
      releaseNotes: release.releaseNotes,
      publishedAt: release.publishedAt,
      artifact: {
        id: release.id,
        fileName: release.fileName,
        size: release.sizeBytes,
        sha256: release.sha256,
        url: `${config.PUBLIC_BASE_URL}/api/v1/downloads/${release.id}`
      }
    },
    meta: { apiVersion: "v1" }
  });
}
