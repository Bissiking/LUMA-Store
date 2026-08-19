import { describe, expect, it } from "vitest";
import { applicationInput, validateArtifactMagic, validateArtifactName } from "@/lib/validation";

describe("validation des artefacts", () => {
  it("refuse un nom qui ressemble à une traversée de chemin", () => {
    expect(() => validateArtifactName("../../LUMA Agent-1.0.0.msi", "msi")).toThrow(/Nom de fichier/);
  });

  it("refuse une extension incohérente", () => {
    expect(() => validateArtifactName("agent.exe", "apk")).toThrow(/extension/);
  });

  it("refuse un exécutable renommé en APK", () => {
    expect(validateArtifactMagic(Buffer.from([0x4d, 0x5a, 0x00, 0x00]), "apk")).toBe(false);
    expect(validateArtifactMagic(Buffer.from([0x50, 0x4b, 0x03, 0x04]), "apk")).toBe(true);
  });
});

describe("validation des applications", () => {
  it("refuse les slugs ambigus", () => {
    expect(applicationInput.safeParse({ name: "Test", slug: "../test", summary: "Un résumé suffisamment long", description: "", publisher: "LUMA", category: "Outils", isFeatured: false, status: "draft" }).success).toBe(false);
  });
});
