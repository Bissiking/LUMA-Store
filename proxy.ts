import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const isDev = process.env.NODE_ENV !== "production";
  response.headers.set("Content-Security-Policy", [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"])
  ].join("; "));
  if (!isDev) response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("X-Robots-Tag", request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/login") ? "noindex, nofollow" : "index, follow");
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|icon.png|favicon.ico).*)"] };
