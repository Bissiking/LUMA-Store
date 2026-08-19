import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { config } from "@/lib/config";
import { query } from "@/lib/db";
import { decryptSecret, encryptSecret, randomToken, sha256 } from "@/lib/crypto";

const SESSION_COOKIE = "luma_store_session";
const STATE_COOKIE = "luma_store_oauth_state";
const stateKey = new TextEncoder().encode(config.SESSION_SECRET);

function kyrosHandshake() {
  return {
    kyros_sso_version: config.KYROS_SSO_VERSION,
    kyros_edition: config.KYROS_EDITION,
    kyros_application_scope: config.KYROS_APPLICATION_SCOPE
  };
}

export interface AdminUser {
  id: string;
  displayName: string;
  email: string | null;
  isAdmin: true;
}

export async function createState(returnTo = "/admin") {
  const state = randomToken(32);
  const token = await new SignJWT({ state, returnTo: returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(stateKey);
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, token, {
    httpOnly: true, secure: config.isProduction, sameSite: "lax", path: "/auth/callback", maxAge: 600
  });
  return state;
}

export async function consumeState(state: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, stateKey, { algorithms: ["HS256"] });
    return payload.state === state ? String(payload.returnTo ?? "/admin") : null;
  } catch {
    return null;
  }
}

export function kyrosAuthorizeUrl(state: string) {
  if (!config.kyrosConfigured || !config.KYROS_BASE_URL) throw new Error("Kyros n'est pas configuré.");
  const url = new URL("/authorize", config.KYROS_BASE_URL);
  url.search = new URLSearchParams({
    client_id: config.KYROS_CLIENT_ID,
    redirect_uri: `${config.PUBLIC_BASE_URL}/auth/callback`,
    scope: config.KYROS_SCOPE,
    state,
    ...kyrosHandshake()
  }).toString();
  return url;
}

export async function exchangeKyrosCode(code: string) {
  if (!config.kyrosConfigured || !config.KYROS_BASE_URL) throw new Error("Kyros n'est pas configuré.");
  const response = await fetch(new URL("/token", config.KYROS_BASE_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: config.KYROS_CLIENT_ID,
      client_secret: config.KYROS_CLIENT_SECRET,
      code,
      redirect_uri: `${config.PUBLIC_BASE_URL}/auth/callback`,
      ...kyrosHandshake()
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new Error(`Échange Kyros refusé (${response.status}).`);
  const data = await response.json() as { access_token: string; refresh_token?: string; expires_in: number; user?: Record<string, unknown> };
  const { payload } = await jwtVerify(data.access_token, new TextEncoder().encode(config.KYROS_JWT_SECRET), {
    algorithms: ["HS256"], issuer: config.KYROS_ISSUER, audience: config.KYROS_AUDIENCE
  });
  if (payload.resource_aud !== config.KYROS_RESOURCE_AUDIENCE) throw new Error("Audience Kyros incorrecte.");
  const role = payload.role ?? data.user?.role;
  if (role !== "admin") throw new Error("Ce compte Kyros n'est pas administrateur.");
  const userId = String(payload.sub ?? data.user?.id ?? "");
  if (!userId) throw new Error("Identifiant Kyros absent.");
  return {
    user: {
      id: userId,
      displayName: String(payload.display_name ?? data.user?.displayName ?? data.user?.username ?? "Administrateur"),
      email: payload.email ? String(payload.email) : data.user?.email ? String(data.user.email) : null,
      isAdmin: true as const
    },
    refreshToken: data.refresh_token ?? null
  };
}

export async function createAdminSession(user: AdminUser, refreshToken: string | null) {
  const rawId = randomToken(32);
  const expiresAt = new Date(Date.now() + config.SESSION_TTL_HOURS * 3_600_000);
  await query(
    `INSERT INTO admin_sessions (id_hash, user_id, display_name, email, refresh_token_encrypted, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [sha256(rawId), user.id, user.displayName, user.email, refreshToken ? encryptSecret(refreshToken) : null, expiresAt]
  );
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, rawId, {
    httpOnly: true, secure: config.isProduction, sameSite: "lax", path: "/", expires: expiresAt
  });
}

export async function getAdmin(): Promise<AdminUser | null> {
  const rawId = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!rawId) return null;
  const result = await query<{ user_id: string; display_name: string | null; email: string | null }>(
    `UPDATE admin_sessions SET last_seen_at = now()
     WHERE id_hash = $1 AND expires_at > now()
     RETURNING user_id, display_name, email`, [sha256(rawId)]
  );
  const row = result.rows[0];
  return row ? { id: row.user_id, displayName: row.display_name ?? "Administrateur", email: row.email, isAdmin: true } : null;
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const rawId = cookieStore.get(SESSION_COOKIE)?.value;
  if (rawId) {
    const result = await query<{ refresh_token_encrypted: string | null }>("DELETE FROM admin_sessions WHERE id_hash = $1 RETURNING refresh_token_encrypted", [sha256(rawId)]);
    const encrypted = result.rows[0]?.refresh_token_encrypted;
    if (encrypted && config.KYROS_BASE_URL) {
      try {
        await fetch(new URL("/revoke", config.KYROS_BASE_URL), {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
            client_id: config.KYROS_CLIENT_ID,
            client_secret: config.KYROS_CLIENT_SECRET,
            refresh_token: decryptSecret(encrypted),
            ...kyrosHandshake()
          }),
          cache: "no-store", signal: AbortSignal.timeout(5_000)
        });
      } catch { /* La session locale est détruite même si Kyros est indisponible. */ }
    }
  }
  cookieStore.delete(SESSION_COOKIE);
}
