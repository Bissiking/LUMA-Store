import { query } from "@/lib/db";
import { sha256 } from "@/lib/crypto";

export async function audit(actorId: string, action: string, entityType: string, entityId: string, metadata: Record<string, unknown> = {}, ip?: string | null) {
  await query(
    `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, ip_hash)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
    [actorId, action, entityType, entityId, JSON.stringify(metadata), ip ? sha256(ip) : null]
  );
}
