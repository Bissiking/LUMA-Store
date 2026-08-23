import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Release, StoreApplication } from "@/lib/types";

vi.mock("@/lib/store", () => ({
  getApplication: vi.fn(),
  listReleases: vi.fn()
}));

import { GET } from "@/app/api/v1/apps/[slug]/download/route";
import { getApplication, listReleases } from "@/lib/store";

const app: StoreApplication = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "harmonix",
  name: "Harmonix",
  summary: "Application de test pour les téléchargements.",
  description: "",
  publisher: "LUMA",
  iconUrl: null,
  category: "Outils",
  status: "published",
  isFeatured: false,
  platforms: ["windows"],
  latestVersion: "2.0.0",
  updatedAt: "2026-08-23T12:00:00.000Z"
};

const windowsRelease: Release = {
  id: "00000000-0000-4000-8000-000000000002",
  applicationId: app.id,
  version: "2.0.0",
  channel: "stable",
  platform: "windows",
  architecture: "x64",
  packageType: "msi",
  minimumOs: null,
  releaseNotes: "",
  fileName: "harmonix-2.0.0.msi",
  sizeBytes: 42,
  sha256: "a".repeat(64),
  isProtected: false,
  status: "published",
  publishedAt: "2026-08-23T12:00:00.000Z"
};

const context = { params: Promise.resolve({ slug: "harmonix" }) };

describe("GET /api/v1/apps/[slug]/download", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApplication).mockResolvedValue(app);
    vi.mocked(listReleases).mockResolvedValue([windowsRelease]);
  });

  it("télécharge sans paramètre quand le User-Agent est reconnu", async () => {
    const response = await GET(new Request("http://localhost:3000/api/v1/apps/harmonix/download", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    }), context);

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(`http://localhost:3000/api/v1/downloads/${windowsRelease.id}`);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("renvoie vers la fiche quand le système est inconnu", async () => {
    const response = await GET(new Request("http://localhost:3000/api/v1/apps/harmonix/download", {
      headers: { "User-Agent": "curl/8.7.1" }
    }), context);

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("http://localhost:3000/apps/harmonix#releases");
  });

  it("refuse tout paramètre non documenté avant d'interroger le catalogue", async () => {
    const response = await GET(new Request("http://localhost:3000/api/v1/apps/harmonix/download?unexpected=1"), context);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: { code: "invalid_parameters", message: "Paramètres de téléchargement invalides." }
    });
    expect(getApplication).not.toHaveBeenCalled();
  });
});
