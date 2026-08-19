import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/http";

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) return new Response("Origine refusée.", { status: 403 });
  await destroyAdminSession();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
