"use client";

import { useState } from "react";
import { Download, LockKeyhole, Trash2, UnlockKeyhole } from "lucide-react";
import type { Release } from "@/lib/types";
import { formatBytes } from "@/lib/format";

export function ReleaseManager({ initialReleases }: { initialReleases: Release[] }) {
  const [releases, setReleases] = useState(initialReleases);
  const [error, setError] = useState<string | null>(null);
  async function protect(release: Release) {
    setError(null); const response = await fetch(`/api/admin/releases/${release.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isProtected: !release.isProtected }) });
    if (!response.ok) { const data = await response.json().catch(() => null); setError(data?.error?.message ?? "Modification impossible."); return; }
    setReleases((items) => items.map((item) => item.id === release.id ? { ...item, isProtected: !item.isProtected } : item));
  }
  async function withdraw(release: Release) {
    if (!window.confirm(`Retirer définitivement le fichier ${release.fileName} ?`)) return;
    setError(null); const response = await fetch(`/api/admin/releases/${release.id}`, { method: "DELETE" });
    if (!response.ok) { const data = await response.json().catch(() => null); setError(data?.error?.message ?? "Retrait impossible."); return; }
    setReleases((items) => items.filter((item) => item.id !== release.id));
  }
  return <section className="release-management"><h2>Versions publiées</h2>{error && <div className="form-message form-message-error" role="alert">{error}</div>}<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Version</th><th>Cible</th><th>Fichier</th><th>Protection</th><th>Actions</th></tr></thead><tbody>
    {releases.map((release) => <tr key={release.id}><td><strong>{release.version}</strong><br /><small>{release.channel}</small></td><td>{release.platform} · {release.architecture}</td><td>{release.fileName}<br /><small>{formatBytes(release.sizeBytes)}</small></td><td>{release.isProtected ? "Protégée" : "Standard"}</td><td><div className="row-actions"><a className="icon-button" href={`/api/v1/downloads/${release.id}`} aria-label={`Télécharger ${release.version}`}><Download size={17} /></a><button className="icon-button" type="button" onClick={() => protect(release)} aria-label={release.isProtected ? "Retirer la protection" : "Protéger la version"}>{release.isProtected ? <UnlockKeyhole size={17} /> : <LockKeyhole size={17} />}</button><button className="icon-button danger-icon" type="button" onClick={() => withdraw(release)} disabled={release.isProtected} aria-label="Retirer la version"><Trash2 size={17} /></button></div></td></tr>)}
    {!releases.length && <tr><td colSpan={5}>Aucune version publiée.</td></tr>}
  </tbody></table></div></section>;
}
