import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export function jsonError(message: string, status: number, code = "request_failed") {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin === new URL(config.PUBLIC_BASE_URL).origin;
}

export function redirectAbsolute(path: string, status?: number) {
  return NextResponse.redirect(new URL(path, config.PUBLIC_BASE_URL), status);
}

export function noStoreJson(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  return NextResponse.json(data, { ...init, headers });
}
