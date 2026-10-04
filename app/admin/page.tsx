import Link from "next/link";
import { statfs } from "node:fs/promises";
import { query } from "@/lib/db";
import { config } from "@/lib/config";
import { formatBytes } from "@/lib/format";
export default async function AdminDashboard() {
  const [stats, activity, releases, storage] = await Promise.all([
    query<{
      applications: string;
      published: string;
      drafts: string;
      releases: string;
      platforms: string;
      pending: string;
      bytes: string;
    }>(
      `SELECT (SELECT count(*) FROM applications) AS applications,(SELECT count(*) FROM applications WHERE status='published') AS published,(SELECT count(*) FROM applications WHERE status='draft') AS drafts,(SELECT count(*) FROM releases WHERE status='published') AS releases,(SELECT count(DISTINCT platform) FROM releases WHERE status='published') AS platforms,(SELECT count(*) FROM releases WHERE status='pending') AS pending,(SELECT COALESCE(sum(size_bytes),0) FROM releases WHERE storage_key IS NOT NULL)+(SELECT COALESCE(sum(size_bytes),0) FROM application_media) AS bytes`,
    ),
    query<{ id: string; action: string; created_at: Date }>(
      "SELECT id,action,created_at FROM audit_logs ORDER BY created_at DESC LIMIT 8",
    ),
    query<{
      id: string;
      application_id: string;
      name: string;
      version: string;
      platform: string;
      published_at: Date;
    }>(
      "SELECT r.id,r.application_id,a.name,r.version,r.platform,r.published_at FROM releases r JOIN applications a ON a.id=r.application_id WHERE r.status='published' ORDER BY r.published_at DESC LIMIT 6",
    ),
    statfs(config.STORAGE_DIR).catch(() => null),
  ]);
  const counts = stats.rows[0];
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Vue d’ensemble</h1>
          <p>Publications, activité et état de la distribution.</p>
        </div>
        <Link className="button button-primary" href="/admin/apps/new">
          Nouvelle application
        </Link>
      </div>
      <div className="dashboard-stats">
        {[
          [counts.applications, "Applications"],
          [counts.releases, "Releases publiées"],
          [counts.published, "Applications publiques"],
          [counts.platforms, "Plateformes actives"],
        ].map(([value, label]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <p>
        {counts.drafts} brouillon(s) ? {counts.pending} envoi(s) en attente
      </p>
      {Number(counts.pending) > 0 && (
        <p className="form-message">
          Des envois sont en attente. Reprenez-les depuis les versions de
          l’application.
        </p>
      )}
      <div className="settings-grid">
        <section>
          <h2>Dernières releases</h2>
          {releases.rows.map((row) => (
            <p key={row.id}>
              <Link href={`/admin/apps/${row.application_id}?tab=versions`}>
                {row.name} · {row.version}
              </Link>{" "}
              ? {row.platform}
            </p>
          ))}
          {!releases.rowCount && <p>Aucune publication.</p>}
        </section>
        <section>
          <h2>Activité récente</h2>
          {activity.rows.map((row) => (
            <p key={row.id}>
              {row.action} ·{" "}
              {row.created_at.toLocaleString("fr-FR", {
                timeZone: "Europe/Paris",
              })}
            </p>
          ))}
          {!activity.rowCount && <p>Aucune activité.</p>}
        </section>
        <section>
          <h2>Stockage</h2>
          <p>Artefacts et médias : {formatBytes(Number(counts.bytes))}</p>
          <p>
            {storage
              ? `Espace disponible : ${formatBytes(storage.bavail * storage.bsize)}`
              : "Stockage indisponible ou pas encore initialisé."}
          </p>
        </section>
      </div>
    </>
  );
}
