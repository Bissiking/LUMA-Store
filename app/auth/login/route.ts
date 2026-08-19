import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { createState, kyrosAuthorizeUrl } from "@/lib/auth";

export async function GET(request: Request) {
  if (!config.kyrosConfigured) return NextResponse.redirect(new URL("/login?error=kyros_not_configured", request.url));
  const returnTo = new URL(request.url).searchParams.get("returnTo") ?? "/admin";
  const state = await createState(returnTo);
  return NextResponse.redirect(kyrosAuthorizeUrl(state));
}
