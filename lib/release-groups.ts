import semver from "semver";
import type { Release } from "@/lib/types";
export function groupReleases<
  T extends Pick<Release, "version" | "channel" | "publishedAt">,
>(releases: T[]) {
  const groups = new Map<string, T[]>();
  for (const release of releases)
    groups.set(release.version, [
      ...(groups.get(release.version) ?? []),
      release,
    ]);
  return [...groups.entries()].sort(([a, ra], [b, rb]) => {
    const stableA = ra.some((item) => item.channel === "stable");
    const stableB = rb.some((item) => item.channel === "stable");
    if (stableA !== stableB) return stableA ? -1 : 1;
    const va = semver.valid(a.replace(/^v/, "")),
      vb = semver.valid(b.replace(/^v/, ""));
    return va && vb
      ? semver.rcompare(va, vb)
      : (rb[0].publishedAt ?? "").localeCompare(ra[0].publishedAt ?? "");
  });
}
