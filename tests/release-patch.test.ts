import { describe, expect, it } from "vitest";
import { releasePatchInput, applicationPatchInput } from "@/lib/validation";
describe("Correction des releases", () => {
  it("autorise une correction d’architecture sans changer le binaire", () => {
    expect(
      releasePatchInput.parse({ architecture: "x64", isPublic: false }),
    ).toEqual({ architecture: "x64", isPublic: false });
  });
  it("ne réinitialise pas la fiche en changeant uniquement sa visibilité", () => {
    expect(applicationPatchInput.parse({ status: "hidden" })).toEqual({
      status: "hidden",
    });
  });
  it.each([
    "storageKey",
    "fileName",
    "sha256",
    "applicationId",
    "originalFileName",
    "detectedArchitectureRaw",
  ])("interdit la modification de %s", (field) => {
    expect(
      releasePatchInput.safeParse({ [field]: "replacement" }).success,
    ).toBe(false);
  });
});
