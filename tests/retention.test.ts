import { expect, it } from "vitest";
import { withdrawalError } from "@/lib/retention";
import type { Release } from "@/lib/types";
const releases = Array.from(
  { length: 6 },
  (_, index) =>
    ({
      id: String(index),
      version: `1.${index}.0`,
      status: "published",
      channel: "stable",
      isProtected: false,
      publishedAt: "2026-01-01",
    }) as Release,
);
it("conserve la version courante même si une ancienne version est republiée", () => {
  expect(withdrawalError(releases, "5", 5)).toBe("current_version");
  expect(withdrawalError(releases, "0", 5)).toBeNull();
});
it("compte les versions distinctes et non les packages", () => {
  expect(
    withdrawalError(
      [...releases.slice(0, 5), { ...releases[1], id: "extra" }],
      "0",
      5,
    ),
  ).toBe("minimum_retention");
});
it("conserve les releases protégées", () => {
  expect(withdrawalError([{ ...releases[0], isProtected: true }], "0", 5)).toBe(
    "release_protected",
  );
});
