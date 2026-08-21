import { NextResponse } from "next/server";
import { consumeState, createAdminSession, exchangeKyrosCode } from "@/lib/auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { redirectAbsolute } from "@/lib/http";

export async function GET(request: Request) {
  if (!rateLimit(`callback:${clientKey(request)}`, 15, 60_000).allowed) return redirectAbsolute("/login?error=rate_limited");
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return redirectAbsolute("/login?error=invalid_callback");
  const returnTo = await consumeState(state);
  if (!returnTo) return redirectAbsolute("/login?error=invalid_state");
  try {
    const { user, refreshToken } = await exchangeKyrosCode(code);
    await createAdminSession(user, refreshToken);
    return redirectAbsolute(returnTo);
  } catch (error) {
    console.error("Kyros callback refused:", error instanceof Error ? error.message : "unknown");
    return redirectAbsolute("/login?error=access_denied");
  }
}
