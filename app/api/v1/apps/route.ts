import { listApplications } from "@/lib/store";
import { noStoreJson } from "@/lib/http";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function GET(request: Request) {
  if (!rateLimit(`catalog:${clientKey(request)}`, 120, 60_000).allowed) return noStoreJson({ error: { code: "rate_limited", message: "Trop de requêtes." } }, { status: 429 });
  const url = new URL(request.url);
  const apps = await listApplications({ publicOnly: true, query: url.searchParams.get("q")?.slice(0, 100), category: url.searchParams.get("category")?.slice(0, 60) });
  return noStoreJson({ data: apps, meta: { count: apps.length, apiVersion: "v1" } });
}
