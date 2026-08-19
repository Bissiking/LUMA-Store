import { NextResponse } from "next/server";
import { consumeState, createAdminSession, exchangeKyrosCode } from "@/lib/auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function GET(request: Request) {
  if (!rateLimit(`callback:${clientKey(request)}`, 15, 60_000).allowed) return NextResponse.redirect(new URL("/login?error=rate_limited", request.url));
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return NextResponse.redirect(new URL("/login?error=invalid_callback", request.url));
  const returnTo = await consumeState(state);
  if (!returnTo) return NextResponse.redirect(new URL("/login?error=invalid_state", request.url));
  try {
    const { user, refreshToken } = await exchangeKyrosCode(code);
    await createAdminSession(user, refreshToken);
    return NextResponse.redirect(new URL(returnTo, request.url));
  } catch (error) {
    console.error("Kyros callback refused:", error instanceof Error ? error.message : "unknown");
    return NextResponse.redirect(new URL("/login?error=access_denied", request.url));
  }
}
