import { describe, expect, it } from "vitest";
import { selectUpdate } from "@/lib/store";
import type { Release } from "@/lib/types";

const release = (version: string, platform: Release["platform"] = "windows", architecture: Release["architecture"] = "x64", channel: Release["channel"] = "stable"): Release => ({
  id: version, applicationId: "app", version, platform, architecture, channel, packageType: platform === "windows" ? "msi" : "deb",
  minimumOs: null, releaseNotes: "", fileName: `app-${version}`, sizeBytes: 10, sha256: "a".repeat(64), isProtected: false, status: "published", publishedAt: new Date().toISOString()
});

describe("selectUpdate", () => {
  it("choisit la version compatible la plus récente", () => {
    expect(selectUpdate([release("1.3.0"), release("2.0.0"), release("1.8.0")], "1.2.0", "windows", "x64", "stable")?.version).toBe("2.0.0");
  });

  it("accepte une release universelle", () => {
    expect(selectUpdate([release("1.1.0", "macos", "universal")], "1.0.0", "macos", "arm64", "stable")?.version).toBe("1.1.0");
  });

  it("ne traverse ni plateforme ni canal", () => {
    expect(selectUpdate([release("9.0.0", "linux"), release("8.0.0", "windows", "x64", "beta")], "1.0.0", "windows", "x64", "stable")).toBeNull();
  });

  it("refuse une version courante invalide", () => {
    expect(selectUpdate([release("2.0.0")], "banana", "windows", "x64", "stable")).toBeNull();
  });
});
