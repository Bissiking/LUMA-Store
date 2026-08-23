import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PUBLIC_BASE_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1).default("postgres://postgres:postgres@localhost:55432/luma_store"),
  DATABASE_SSL: z.enum(["true", "false"]).default("false"),
  STORAGE_DIR: z.string().default("./storage"),
  MAX_ARTIFACT_SIZE_BYTES: z.coerce.number().int().positive().default(8 * 1024 ** 3),
  MIN_VERSIONS_TO_KEEP: z.coerce.number().int().min(5).default(5),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(12),
  SESSION_SECRET: z.string().min(32).default("dev-only-session-secret-change-me-123456"),
  SESSION_ENCRYPTION_KEY: z.string().min(32).default("dev-only-encryption-key-change-me-1234"),
  KYROS_BASE_URL: z.string().url().optional().or(z.literal("")),
  KYROS_CLIENT_ID: z.string().optional().default(""),
  KYROS_CLIENT_SECRET: z.string().optional().default(""),
  KYROS_JWT_SECRET: z.string().optional().default(""),
  KYROS_ISSUER: z.string().default("kyros"),
  KYROS_AUDIENCE: z.string().default("kyros-modules"),
  KYROS_RESOURCE_AUDIENCE: z.string().default("kyros:sso:luma-store"),
  KYROS_SCOPE: z.string().default("profile email"),
  KYROS_SSO_VERSION: z.string().min(1).default("v3"),
  KYROS_EDITION: z.enum(["standard", "enterprise"]).default("standard"),
  KYROS_APPLICATION_SCOPE: z.enum(["standard", "enterprise", "both"]).default("standard"),
  ARGOS_BASE_URL: z.string().url().optional().or(z.literal("")),
  ARGOS_TOKEN: z.string().optional().default("")
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Configuration invalide: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
}

const isProduction = parsed.data.NODE_ENV === "production";
const securityConfigured = !isProduction || (!parsed.data.SESSION_SECRET.startsWith("dev-only") && !parsed.data.SESSION_ENCRYPTION_KEY.startsWith("dev-only"));

export const config = {
  ...parsed.data,
  isProduction,
  securityConfigured,
  kyrosConfigured: Boolean(securityConfigured && parsed.data.KYROS_BASE_URL && parsed.data.KYROS_CLIENT_ID && parsed.data.KYROS_CLIENT_SECRET && parsed.data.KYROS_JWT_SECRET),
  argosConfigured: Boolean(parsed.data.ARGOS_BASE_URL && parsed.data.ARGOS_TOKEN)
};
