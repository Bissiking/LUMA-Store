import semver from "semver";
import { query } from "@/lib/db";
import type { Architecture, Channel, Platform, Release, StoreApplication } from "@/lib/types";

type AppRow = {
  id: string; slug: string; name: string; summary: string; description: string; publisher: string;
  icon_url: string | null; category: string; status: "draft" | "published" | "retired"; is_featured: boolean;
  platforms: Platform[] | null; latest_version: string | null; updated_at: Date;
};

const mapApp = (row: AppRow): StoreApplication => ({
  id: row.id, slug: row.slug, name: row.name, summary: row.summary, description: row.description,
  publisher: row.publisher, iconUrl: row.icon_url, category: row.category, status: row.status,
  isFeatured: row.is_featured, platforms: row.platforms ?? [], latestVersion: row.latest_version,
  updatedAt: row.updated_at.toISOString()
});

const appSelect = `SELECT a.*, COALESCE(array_agg(DISTINCT r.platform) FILTER (WHERE r.status = 'published'), '{}') AS platforms,
  (array_agg(r.version ORDER BY r.published_at DESC) FILTER (WHERE r.status = 'published'))[1] AS latest_version
  FROM applications a LEFT JOIN releases r ON r.application_id = a.id`;

export async function listApplications(options: { publicOnly?: boolean; query?: string; category?: string; platform?: Platform } = {}) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (options.publicOnly) conditions.push("a.status = 'published'");
  if (options.query) { values.push(`%${options.query}%`); conditions.push(`(a.name ILIKE $${values.length} OR a.summary ILIKE $${values.length})`); }
  if (options.category) { values.push(options.category); conditions.push(`a.category = $${values.length}`); }
  if (options.platform) { values.push(options.platform); conditions.push(`EXISTS (SELECT 1 FROM releases rp WHERE rp.application_id = a.id AND rp.platform = $${values.length} AND rp.status = 'published')`); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await query<AppRow>(`${appSelect} ${where} GROUP BY a.id ORDER BY a.is_featured DESC, a.updated_at DESC`, values);
  return result.rows.map(mapApp);
}

export async function listApplicationsOrNull(options: Parameters<typeof listApplications>[0] = {}) {
  try {
    return await listApplications(options);
  } catch {
    return null;
  }
}

export async function getApplication(slug: string, publicOnly = true) {
  const result = await query<AppRow>(`${appSelect} WHERE a.slug = $1 ${publicOnly ? "AND a.status = 'published'" : ""} GROUP BY a.id`, [slug]);
  return result.rows[0] ? mapApp(result.rows[0]) : null;
}

export async function getApplicationById(id: string) {
  const result = await query<AppRow>(`${appSelect} WHERE a.id = $1 GROUP BY a.id`, [id]);
  return result.rows[0] ? mapApp(result.rows[0]) : null;
}

export async function listReleases(applicationId: string, publicOnly = true) {
  const result = await query<{
    id: string; application_id: string; version: string; channel: Channel; platform: Platform; architecture: Architecture;
    package_type: Release["packageType"]; minimum_os: string | null; release_notes: string; file_name: string | null;
    size_bytes: string | null; sha256: string | null; is_protected: boolean; status: Release["status"]; published_at: Date | null;
  }>(`SELECT * FROM releases WHERE application_id = $1 ${publicOnly ? "AND status = 'published'" : ""} ORDER BY published_at DESC NULLS LAST, created_at DESC`, [applicationId]);
  return result.rows.map((row) => ({
    id: row.id, applicationId: row.application_id, version: row.version, channel: row.channel, platform: row.platform,
    architecture: row.architecture, packageType: row.package_type, minimumOs: row.minimum_os, releaseNotes: row.release_notes,
    fileName: row.file_name, sizeBytes: row.size_bytes ? Number(row.size_bytes) : null, sha256: row.sha256,
    isProtected: row.is_protected, status: row.status, publishedAt: row.published_at?.toISOString() ?? null
  }));
}

export function selectUpdate(releases: Release[], currentVersion: string, platform: Platform, architecture: Architecture, channel: Channel) {
  const current = semver.coerce(currentVersion);
  if (!current) return null;
  return releases
    .filter((release) => release.platform === platform && release.channel === channel && (release.architecture === architecture || release.architecture === "universal"))
    .filter((release) => semver.valid(semver.coerce(release.version)) && semver.gt(semver.coerce(release.version)!, current))
    .sort((a, b) => semver.rcompare(semver.coerce(a.version)!, semver.coerce(b.version)!))[0] ?? null;
}
