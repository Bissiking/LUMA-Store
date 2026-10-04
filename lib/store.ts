import { groupReleases } from "@/lib/release-groups";
import semver from "semver";
import { query } from "@/lib/db";
import type {
  Architecture,
  Channel,
  Platform,
  Release,
  StoreApplication,
} from "@/lib/types";

type AppRow = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  publisher: string;
  icon_url: string | null;
  category: string;
  status: StoreApplication["status"];
  is_featured: boolean;
  icon_managed?: boolean;
  version_candidates?: Release[];
  supported_platforms?: Platform[];
  managed_icon_id?: string | null;
  minimum_versions_to_keep?: number | null;
  platforms: Platform[] | null;
  latest_version: string | null;
  updated_at: Date;
};

const mapApp = (row: AppRow): StoreApplication => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  summary: row.summary,
  description: row.description,
  publisher: row.publisher,
  iconUrl: row.managed_icon_id
    ? `/api/media/${row.managed_icon_id}`
    : row.icon_managed
      ? null
      : row.icon_url,
  category: row.category,
  status: row.status,
  isFeatured: row.is_featured,
  platforms: [
    ...new Set([...(row.supported_platforms ?? []), ...(row.platforms ?? [])]),
  ],
  minimumVersionsToKeep: row.minimum_versions_to_keep,
  latestVersion: row.version_candidates
    ? (groupReleases(row.version_candidates)[0]?.[0] ?? null)
    : row.latest_version,
  updatedAt: row.updated_at.toISOString(),
});

const appSelect = `SELECT a.*, COALESCE(jsonb_agg(jsonb_build_object('version',r.version,'channel',r.channel,'publishedAt',r.published_at)) FILTER (WHERE r.status='published' AND r.is_public),'[]'::jsonb) AS version_candidates, (SELECT id FROM application_media WHERE application_id=a.id AND kind='icon') AS managed_icon_id, COALESCE(array_agg(DISTINCT r.platform) FILTER (WHERE r.status = 'published' AND r.is_public), '{}') AS platforms,
  (array_agg(r.version ORDER BY r.published_at DESC) FILTER (WHERE r.status = 'published' AND r.is_public))[1] AS latest_version
  FROM applications a LEFT JOIN releases r ON r.application_id = a.id`;

export async function listApplications(
  options: {
    publicOnly?: boolean;
    query?: string;
    category?: string;
    platform?: Platform;
  } = {},
) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (options.publicOnly) conditions.push("a.status = 'published'");
  if (options.query) {
    values.push(`%${options.query}%`);
    conditions.push(
      `(a.name ILIKE $${values.length} OR a.summary ILIKE $${values.length})`,
    );
  }
  if (options.category) {
    values.push(options.category);
    conditions.push(`a.category = $${values.length}`);
  }
  if (options.platform) {
    values.push(options.platform);
    conditions.push(
      `($${values.length}=ANY(a.supported_platforms) OR EXISTS (SELECT 1 FROM releases rp WHERE rp.application_id = a.id AND rp.platform = $${values.length} AND rp.status = 'published' AND rp.is_public))`,
    );
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await query<AppRow>(
    `${appSelect} ${where} GROUP BY a.id ORDER BY a.is_featured DESC, a.updated_at DESC`,
    values,
  );
  return result.rows.map(mapApp);
}

export async function listApplicationsOrNull(
  options: Parameters<typeof listApplications>[0] = {},
) {
  try {
    return await listApplications(options);
  } catch {
    return null;
  }
}

export async function getApplication(slug: string, publicOnly = true) {
  const result = await query<AppRow>(
    `${appSelect} WHERE a.slug = $1 ${publicOnly ? "AND a.status = 'published'" : ""} GROUP BY a.id`,
    [slug],
  );
  return result.rows[0] ? mapApp(result.rows[0]) : null;
}

export async function getApplicationById(id: string) {
  const result = await query<AppRow>(
    `${appSelect} WHERE a.id = $1 GROUP BY a.id`,
    [id],
  );
  return result.rows[0] ? mapApp(result.rows[0]) : null;
}

export async function listReleases(
  applicationId: string,
  publicOnly = true,
): Promise<Release[]> {
  const result = await query<{
    id: string;
    application_id: string;
    version: string;
    channel: Channel;
    platform: Platform;
    architecture: Architecture;
    package_type: Release["packageType"];
    minimum_os: string | null;
    release_notes: string;
    file_name: string | null;
    original_file_name: string | null;
    detected_version_raw: string | null;
    detected_architecture_raw: string | null;
    detected_package_raw: string | null;
    detected_distribution_raw: string | null;
    distribution: string | null;
    is_public: boolean;
    size_bytes: string | null;
    sha256: string | null;
    is_protected: boolean;
    status: Release["status"];
    published_at: Date | null;
  }>(
    `SELECT * FROM releases WHERE application_id = $1 ${publicOnly ? "AND status = 'published' AND is_public" : ""} ORDER BY published_at DESC NULLS LAST, created_at DESC`,
    [applicationId],
  );
  return result.rows.map((row) => ({
    originalFileName: row.original_file_name,
    detectedVersionRaw: row.detected_version_raw,
    detectedArchitectureRaw: row.detected_architecture_raw,
    detectedPackageRaw: row.detected_package_raw,
    detectedDistributionRaw: row.detected_distribution_raw,
    distribution: row.distribution,
    isPublic: row.is_public,
    id: row.id,
    applicationId: row.application_id,
    version: row.version,
    channel: row.channel,
    platform: row.platform,
    architecture: row.architecture,
    packageType: row.package_type,
    minimumOs: row.minimum_os,
    releaseNotes: row.release_notes,
    fileName: row.file_name,
    sizeBytes: row.size_bytes ? Number(row.size_bytes) : null,
    sha256: row.sha256,
    isProtected: row.is_protected,
    status: row.status,
    publishedAt: row.published_at?.toISOString() ?? null,
  }));
}

export function selectUpdate(
  releases: Release[],
  currentVersion: string,
  platform: Platform,
  architecture: Architecture,
  channel: Channel,
) {
  const current = semver.coerce(currentVersion);
  if (!current) return null;
  return (
    releases
      .filter(
        (release) =>
          release.status === "published" && release.isPublic !== false,
      )
      .filter(
        (release) =>
          release.platform === platform &&
          release.channel === channel &&
          (release.architecture === architecture ||
            release.architecture === "universal"),
      )
      .filter(
        (release) =>
          semver.valid(semver.coerce(release.version)) &&
          semver.gt(semver.coerce(release.version)!, current),
      )
      .sort((a, b) =>
        semver.rcompare(semver.coerce(a.version)!, semver.coerce(b.version)!),
      )[0] ?? null
  );
}
