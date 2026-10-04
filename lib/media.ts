import { query } from "@/lib/db";
import type { ApplicationMedia, Platform } from "@/lib/types";

export async function listMedia(
  applicationId: string,
): Promise<ApplicationMedia[]> {
  const result = await query<{
    id: string;
    application_id: string;
    kind: ApplicationMedia["kind"];
    width: number;
    height: number;
    size_bytes: string;
    caption: string;
    platform: Platform | null;
    sort_order: number;
  }>(
    "SELECT * FROM application_media WHERE application_id=$1 ORDER BY sort_order,created_at",
    [applicationId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    applicationId: row.application_id,
    kind: row.kind,
    url: `/api/media/${row.id}`,
    width: row.width,
    height: row.height,
    sizeBytes: Number(row.size_bytes),
    caption: row.caption,
    platform: row.platform,
    sortOrder: row.sort_order,
  }));
}
