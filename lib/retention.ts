import { groupReleases } from "@/lib/release-groups";
import type { Release } from "@/lib/types";
export function withdrawalError(
  releases: Pick<
    Release,
    "id" | "version" | "channel" | "status" | "isProtected" | "publishedAt"
  >[],
  targetId: string,
  minimum: number,
) {
  const target = releases.find((item) => item.id === targetId);
  if (!target) return "not_found";
  if (target.isProtected) return "release_protected";
  if (target.status === "pending") return null;
  if (target.status !== "published") return "not_found";
  const published = releases.filter((item) => item.status === "published");
  if (groupReleases(published)[0]?.[0] === target.version)
    return "current_version";
  if (
    new Set(
      published
        .filter((item) => item.id !== targetId)
        .map((item) => item.version),
    ).size < minimum
  )
    return "minimum_retention";
  return null;
}
