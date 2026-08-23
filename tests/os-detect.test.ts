import { describe, expect, it } from "vitest";
import { detectPlatform, matchRelease } from "@/lib/os-detect";
import type { Release } from "@/lib/types";

const release = (
  version: string,
  platform: Release["platform"],
  architecture: Release["architecture"],
  channel: Release["channel"] = "stable"
): Release => ({
  id: `${platform}-${architecture}-${version}`,
  applicationId: "app",
  version,
  channel,
  platform,
  architecture,
  packageType: platform === "macos" ? "dmg" : platform === "android" ? "apk" : "zip",
  minimumOs: null,
  releaseNotes: "",
  fileName: `app-${version}.zip`,
  sizeBytes: 10,
  sha256: "a".repeat(64),
  isProtected: false,
  status: "published",
  publishedAt: "2026-08-23T12:00:00.000Z"
});

describe("detectPlatform", () => {
  it("détecte Windows ARM sans le confondre avec x64", () => {
    expect(detectPlatform("Mozilla/5.0 (Windows NT 10.0; ARM64)")).toEqual({ platform: "windows", architecture: "arm64" });
  });

  it("détecte Android et Linux", () => {
    expect(detectPlatform("Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro) AppleWebKit")).toEqual({ platform: "android", architecture: "arm64" });
    expect(detectPlatform("Mozilla/5.0 (X11; Linux aarch64) AppleWebKit")).toEqual({ platform: "linux", architecture: "arm64" });
  });

  it("retourne null pour un client inconnu", () => {
    expect(detectPlatform("curl/8.7.1")).toBeNull();
  });
});

describe("matchRelease", () => {
  it("choisit la dernière version compatible avec l'architecture", () => {
    const releases = [release("3.0.0", "windows", "arm64"), release("2.0.0", "windows", "x64"), release("1.0.0", "windows", "universal")];
    expect(matchRelease(releases, "windows", "x64")?.version).toBe("2.0.0");
  });

  it("accepte un choix de plateforme sans architecture et privilégie l'universel à version égale", () => {
    const releases = [release("2.0.0", "macos", "arm64"), release("2.0.0", "macos", "universal"), release("1.0.0", "macos", "x64")];
    expect(matchRelease(releases, "macos", null)?.architecture).toBe("universal");
  });

  it("reste sur le canal demandé", () => {
    const releases = [release("4.0.0", "linux", "x64", "beta"), release("2.0.0", "linux", "x64")];
    expect(matchRelease(releases, "linux", "x64")?.version).toBe("2.0.0");
  });
});
