import { z } from "zod";
import { config } from "@/lib/config";
import { getApplication, listReleases } from "@/lib/store";
import { matchRelease } from "@/lib/os-detect";
import { slugSchema } from "@/lib/validation";
import { jsonError } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const input = z
  .object({
    app: slugSchema.optional(),
    arch: z.enum(["x64", "arm64", "x86"]).default("x64"),
    package: z.enum(["deb", "rpm"]).default("deb"),
  })
  .strict();
const quote = (value: string) => `'${value.replace(/'/g, "'\\''")}'`;
const script = (body: string) =>
  new Response(`#!/bin/sh\nset -eu\n${body}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
export async function GET(request: Request) {
  if (!rateLimit(`install:${clientKey(request)}`, 60, 60_000).allowed)
    return jsonError("Trop de requêtes.", 429, "rate_limited");
  const parsed = input.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success)
    return jsonError(
      "Paramètres d’installation invalides.",
      400,
      "invalid_parameters",
    );
  if (!parsed.data.app)
    return script(`
app="\${1:-}"
case "$app" in ''|*[!a-z0-9-]*) echo "Usage : sh install.sh identifiant-application" >&2; exit 1;; esac
case "$(uname -m)" in x86_64) arch=x64;; aarch64|arm64) arch=arm64;; i386|i686) arch=x86;; *) echo "Architecture non prise en charge." >&2; exit 1;; esac
if command -v apt-get >/dev/null 2>&1; then package=deb; elif command -v rpm >/dev/null 2>&1; then package=rpm; else echo "Distribution DEB ou RPM requise." >&2; exit 1; fi
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT HUP INT TERM
curl --fail --silent --show-error ${quote(`${config.PUBLIC_BASE_URL}/install/linux`)}"?app=$app&arch=$arch&package=$package" -o "$work/install.sh"
sh "$work/install.sh"
`);
  const app = await getApplication(parsed.data.app);
  if (!app) return jsonError("Application introuvable.", 404, "not_found");
  const release = matchRelease(
    (await listReleases(app.id)).filter(
      (item) => item.packageType === parsed.data.package,
    ),
    "linux",
    parsed.data.arch,
  );
  if (!release?.sha256)
    return jsonError(
      "Aucun package natif compatible.",
      404,
      "package_unavailable",
    );
  const command =
    parsed.data.package === "deb"
      ? 'apt-get install "$work/package.deb"'
      : 'rpm -Uvh "$work/package.rpm"';
  return script(`
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT HUP INT TERM
curl --fail --silent --show-error ${quote(`${config.PUBLIC_BASE_URL}/api/v1/downloads/${release.id}`)} -o "$work/package.${parsed.data.package}"
echo ${quote(`${release.sha256}  `)}"$work/package.${parsed.data.package}" | sha256sum --check --status
echo ${quote(`Installation de ${app.name} ${release.version}`)}
if [ "$(id -u)" -eq 0 ]; then ${command}; else sudo ${command}; fi
`);
}
