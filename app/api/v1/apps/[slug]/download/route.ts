import { z } from "zod";
import { getApplication, listReleases } from "@/lib/store";
import { jsonError } from "@/lib/http";
import { slugSchema } from "@/lib/validation";
import { config } from "@/lib/config";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { detectPlatform, matchRelease } from "@/lib/os-detect";

const downloadQuery = z.object({
  platform: z.enum(["windows", "macos", "linux", "android"]).optional(),
  arch: z.enum(["x64", "arm64", "universal"]).optional(),
  channel: z.enum(["stable", "beta", "nightly"]).default("stable")
}).strict();

function downloadRedirect(url: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: url, "Cache-Control": "no-store", Vary: "User-Agent" }
  });
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (!rateLimit(`download-resolve:${clientKey(request)}`, 120, 60_000).allowed) {
    return jsonError("Trop de requêtes.", 429, "rate_limited");
  }

  const slug = slugSchema.safeParse((await context.params).slug);
  if (!slug.success) return jsonError("Identifiant d'application invalide.", 400, "invalid_slug");

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = downloadQuery.safeParse(params);
  if (!parsed.success) return jsonError("Paramètres de téléchargement invalides.", 400, "invalid_parameters");

  let platform = parsed.data.platform ?? null;
  let architecture = parsed.data.arch ?? null;
  const channel = parsed.data.channel;
  const detected = detectPlatform(request.headers.get("user-agent"));

  if (!platform) {
    if (detected) {
      platform = detected.platform;
    }
  }
  if (!architecture && detected?.platform === platform) architecture = detected.architecture;

  const app = await getApplication(slug.data);
  if (!app) return jsonError("Application introuvable.", 404, "not_found");

  const releases = await listReleases(app.id);

  if (platform) {
    const release = matchRelease(releases, platform, architecture, channel);
    if (release) {
      const url = new URL(`${config.PUBLIC_BASE_URL}/api/v1/downloads/${release.id}`);
      return downloadRedirect(url.toString());
    }
  }

  return downloadRedirect(`${config.PUBLIC_BASE_URL}/apps/${slug.data}#releases`);
}
