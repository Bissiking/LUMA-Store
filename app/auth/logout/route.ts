import { destroyAdminSession } from "@/lib/auth";
import { redirectAbsolute, requireSameOrigin } from "@/lib/http";

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) return new Response("Origine refusée.", { status: 403 });
  await destroyAdminSession();
  return redirectAbsolute("/", 303);
}
