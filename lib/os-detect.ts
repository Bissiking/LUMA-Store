import semver from "semver";
import type { Architecture, Channel, Platform, Release } from "@/lib/types";

export interface DetectedPlatform {
  platform: Platform;
  architecture: Architecture;
}

export function detectPlatform(userAgent: string | null): DetectedPlatform | null {
  if (!userAgent) return null;
  const ua = userAgent;

  if (/Android/i.test(ua)) {
    return { platform: "android", architecture: /x86_64|x64/i.test(ua) ? "x64" : "arm64" };
  }

  if (/Windows/i.test(ua)) {
    return { platform: "windows", architecture: /ARM64/i.test(ua) ? "arm64" : "x64" };
  }

  if (/Macintosh|Mac OS X/i.test(ua)) {
    const isIntel = /Intel Mac OS X|x86_64/i.test(ua);
    return { platform: "macos", architecture: isIntel ? "x64" : "arm64" };
  }

  if (/Linux/i.test(ua)) {
    return { platform: "linux", architecture: /aarch64|arm64/i.test(ua) ? "arm64" : "x64" };
  }

  return null;
}

export function matchRelease(
  releases: Release[],
  platform: Platform,
  architecture: Architecture | null,
  channel: Channel = "stable"
): Release | null {
  return releases
    .filter((r) => r.status === "published")
    .filter((r) => r.platform === platform && r.channel === channel)
    .filter((r) => architecture === null || r.architecture === architecture || r.architecture === "universal")
    .filter((r) => semver.valid(semver.coerce(r.version)))
    .sort((a, b) => {
      const versionOrder = semver.rcompare(semver.coerce(a.version)!, semver.coerce(b.version)!);
      if (versionOrder !== 0) return versionOrder;
      if (architecture === null && a.architecture !== b.architecture) {
        return a.architecture === "universal" ? -1 : b.architecture === "universal" ? 1 : 0;
      }
      return 0;
    })[0] ?? null;
}

export function platformLabel(platform: Platform): string {
  const labels: Record<Platform, string> = {
    windows: "Windows",
    macos: "macOS",
    linux: "Linux",
    android: "Android"
  };
  return labels[platform];
}
