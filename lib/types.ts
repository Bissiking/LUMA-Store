export type Platform = "windows" | "macos" | "linux" | "android";
export type Architecture = "x64" | "arm64" | "x86" | "universal" | "other";
export type PackageType =
  "apk" | "exe" | "msi" | "dmg" | "deb" | "rpm" | "appimage" | "tar.gz" | "zip";
export type Channel = "stable" | "beta" | "nightly";

export interface StoreApplication {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  publisher: string;
  iconUrl: string | null;
  category: string;
  status: "draft" | "published" | "hidden" | "retired";
  minimumVersionsToKeep?: number | null;
  isFeatured: boolean;
  platforms: Platform[];
  latestVersion: string | null;
  updatedAt: string;
}

export interface Release {
  originalFileName?: string | null;
  detectedVersionRaw?: string | null;
  detectedArchitectureRaw?: string | null;
  detectedPackageRaw?: string | null;
  detectedDistributionRaw?: string | null;
  distribution?: string | null;
  isPublic?: boolean;
  id: string;
  applicationId: string;
  version: string;
  channel: Channel;
  platform: Platform;
  architecture: Architecture;
  packageType: PackageType;
  minimumOs: string | null;
  releaseNotes: string;
  fileName: string | null;
  sizeBytes: number | null;
  sha256: string | null;
  isProtected: boolean;
  status: "pending" | "published" | "withdrawn";
  publishedAt: string | null;
}

export interface ApplicationMedia {
  id: string;
  applicationId: string;
  kind: "icon" | "screenshot";
  url: string;
  width: number;
  height: number;
  sizeBytes: number;
  caption: string;
  platform: Platform | null;
  sortOrder: number;
}
