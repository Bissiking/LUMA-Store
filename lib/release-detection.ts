import type { Architecture, PackageType, Platform } from "@/lib/types";

export function detectRelease(fileName: string) {
  const name = fileName.toLowerCase();
  const detectedVersionRaw =
    name.match(
      /(?:^|[_-])(\d+\.\d+\.\d+(?:-(?:alpha|beta|rc|nightly)[.\d]*)?)/,
    )?.[1] ?? null;
  const detectedArchitectureRaw =
    name.match(
      /(?:^|[_.-])(amd64|x86_64|aarch64|arm64|x64|i386|i686|x86|universal)(?=[_.-]|$)/,
    )?.[1] ?? null;
  const aliases: Record<string, Architecture> = {
    amd64: "x64",
    x86_64: "x64",
    x64: "x64",
    aarch64: "arm64",
    arm64: "arm64",
    i386: "x86",
    i686: "x86",
    x86: "x86",
    universal: "universal",
  };
  const detectedPackageRaw =
    name.match(/\.(tar\.gz|tgz|appimage|deb|rpm|exe|msi|dmg|apk|zip)$/)?.[1] ??
    null;
  const packageType = (
    detectedPackageRaw === "tgz" ? "tar.gz" : detectedPackageRaw
  ) as PackageType | null;
  const platforms: Partial<Record<PackageType, Platform>> = {
    deb: "linux",
    rpm: "linux",
    appimage: "linux",
    exe: "windows",
    msi: "windows",
    dmg: "macos",
    apk: "android",
  };
  const detectedDistributionRaw =
    name.match(
      /(?:^|[_.-])(fc\d+|ubuntu[\d.]*|debian[\d.]*)(?=[_.-]|$)/,
    )?.[1] ?? null;
  return {
    originalFileName: fileName,
    detectedVersionRaw,
    detectedArchitectureRaw,
    detectedPackageRaw,
    detectedDistributionRaw,
    version: detectedVersionRaw,
    architecture: detectedArchitectureRaw
      ? aliases[detectedArchitectureRaw]
      : null,
    packageType,
    platform: packageType ? (platforms[packageType] ?? null) : null,
    distribution: detectedDistributionRaw,
  };
}
