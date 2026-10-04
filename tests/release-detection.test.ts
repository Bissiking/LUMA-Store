import { describe, expect, it } from "vitest";
import { detectRelease } from "@/lib/release-detection";
describe("Détection des releases", () => {
  it("conserve les valeurs brutes du RPM Fedora", () => {
    expect(detectRelease("argos-prob-1.5.0-1.fc44.aarch64.rpm")).toMatchObject({
      version: "1.5.0",
      architecture: "arm64",
      detectedArchitectureRaw: "aarch64",
      packageType: "rpm",
      platform: "linux",
      distribution: "fc44",
    });
  });
  it.each([
    ["amd64", "x64"],
    ["arm64", "arm64"],
    ["i386", "x86"],
    ["x86_64", "x64"],
  ])("normalise %s en %s", (raw, architecture) => {
    expect(detectRelease(`argos-prob_1.5.1_${raw}.deb`)).toMatchObject({
      version: "1.5.1",
      architecture,
      detectedArchitectureRaw: raw,
      packageType: "deb",
      platform: "linux",
    });
  });
  it("n’invente pas une plateforme pour une archive générique", () => {
    expect(detectRelease("application.zip")).toMatchObject({
      version: null,
      architecture: null,
      platform: null,
      packageType: "zip",
    });
  });
  it("détecte un canal prerelease sans absorber la révision du package", () => {
    expect(detectRelease("app-2.0.0-beta.1-x64.exe").version).toBe(
      "2.0.0-beta.1",
    );
  });
});
