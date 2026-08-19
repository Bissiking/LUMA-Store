import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/db", () => ({ query: vi.fn() }));

describe("intégration Kyros", () => {
  it("annonce le protocole SSO v3 et le périmètre standard à l'autorisation", async () => {
    vi.stubEnv("KYROS_BASE_URL", "https://kyros.example.test");
    vi.stubEnv("KYROS_CLIENT_ID", "luma-store");
    vi.stubEnv("KYROS_CLIENT_SECRET", "client-secret");
    vi.stubEnv("KYROS_JWT_SECRET", "jwt-secret");
    vi.resetModules();
    const { kyrosAuthorizeUrl } = await import("@/lib/auth");
    const url = kyrosAuthorizeUrl("state-test");

    expect(url.searchParams.get("kyros_sso_version")).toBe("v3");
    expect(url.searchParams.get("kyros_edition")).toBe("standard");
    expect(url.searchParams.get("kyros_application_scope")).toBe("standard");
  });
});
