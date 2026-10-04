import { readFile } from "node:fs/promises";
import { getAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { artifactPath } from "@/lib/storage";
import { uuidSchema } from "@/lib/validation";
import { jsonError } from "@/lib/http";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = uuidSchema.safeParse((await context.params).id);
  if (!id.success)
    return jsonError("Média invalide.", 400, "validation_failed");
  const result = await query<{
    storage_key: string;
    mime_type: string;
    status: string;
  }>(
    "SELECT m.storage_key,m.mime_type,a.status FROM application_media m JOIN applications a ON a.id=m.application_id WHERE m.id=$1",
    [id.data],
  );
  const row = result.rows[0];
  if (!row || (row.status !== "published" && !(await getAdmin())))
    return jsonError("Média introuvable.", 404, "not_found");
  const bytes = await readFile(artifactPath(row.storage_key)).catch(() => null);
  if (!bytes) return jsonError("Image indisponible.", 503, "media_unavailable");
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": row.mime_type,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
