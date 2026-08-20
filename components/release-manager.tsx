"use client";

import { useRef, useState } from "react";
import { Download, Loader2, LockKeyhole, RotateCcw, Trash2, UnlockKeyhole } from "lucide-react";
import type { Release } from "@/lib/types";
import { formatBytes } from "@/lib/format";
import { uploadBinary } from "@/lib/upload";

export function ReleaseManager({ initialReleases }: { initialReleases: Release[] }) {
  const [releases, setReleases] = useState(initialReleases);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeTargetRef = useRef<string | null>(null);

  const pending = releases.filter((release) => release.status === "pending");
  const published = releases.filter((release) => release.status === "published");

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

  function startResume(release: Release) {
    setError(null);
    resumeTargetRef.current = release.id;
    fileInputRef.current?.click();
  }

  async function resume(release: Release, file: File) {
    setBusyId(release.id); setError(null);
    try {
      const response = await fetch(`/api/admin/releases/${release.id}/resume`, { method: "POST" });
      const ticket = await response.json().catch(() => null);
      if (!response.ok) throw new Error(ticket?.error?.message ?? "Impossible de reprendre l’envoi.");
      const result = await uploadBinary(ticket.data, file, () => {});
      setReleases((items) => items.map((item) => item.id === release.id ? { ...item, status: "published", fileName: result.fileName, sizeBytes: result.sizeBytes, publishedAt: new Date().toISOString() } : item));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Échec de la reprise.");
    } finally {
      setBusyId(null);
    }
  }

  async function cancelPending(release: Release) {
    if (!window.confirm(`Annuler la version ${release.version} en attente ?`)) return;
    setError(null); const response = await fetch(`/api/admin/releases/${release.id}`, { method: "DELETE" });
    if (!response.ok) { const data = await response.json().catch(() => null); setError(data?.error?.message ?? "Annulation impossible."); return; }
    setReleases((items) => items.filter((item) => item.id !== release.id));
  }

  return <section className="release-management">
    <h2>Versions</h2>
    {error && <div className="form-message form-message-error" role="alert">{error}</div>}
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Version</th><th>Cible</th><th>Fichier</th><th>Statut</th><th>Protection</th><th>Actions</th></tr></thead><tbody>
      {pending.map((release) => <tr key={release.id}><td><strong>{release.version}</strong><br /><small>{release.channel}</small></td><td>{release.platform} · {release.architecture}</td><td className="status-cell-muted">En attente d’envoi</td><td><span className="status status-pending">En attente</span></td><td>—</td><td><div className="row-actions">
        <button className="icon-button" type="button" onClick={() => startResume(release)} disabled={busyId === release.id} aria-label={`Reprendre l’envoi de ${release.version}`}>{busyId === release.id ? <Loader2 size={17} className="spin" /> : <RotateCcw size={17} />}</button>
        <button className="icon-button danger-icon" type="button" onClick={() => cancelPending(release)} disabled={busyId === release.id} aria-label="Annuler la version"><Trash2 size={17} /></button>
      </div></td></tr>)}
      {published.map((release) => <tr key={release.id}><td><strong>{release.version}</strong><br /><small>{release.channel}</small></td><td>{release.platform} · {release.architecture}</td><td>{release.fileName}<br /><small>{formatBytes(release.sizeBytes)}</small></td><td><span className="status status-published">Publiée</span></td><td>{release.isProtected ? "Protégée" : "Standard"}</td><td><div className="row-actions">
        <a className="icon-button" href={`/api/v1/downloads/${release.id}`} aria-label={`Télécharger ${release.version}`}><Download size={17} /></a>
        <button className="icon-button" type="button" onClick={() => protect(release)} aria-label={release.isProtected ? "Retirer la protection" : "Protéger la version"}>{release.isProtected ? <UnlockKeyhole size={17} /> : <LockKeyhole size={17} />}</button>
        <button className="icon-button danger-icon" type="button" onClick={() => withdraw(release)} disabled={release.isProtected} aria-label="Retirer la version"><Trash2 size={17} /></button>
      </div></td></tr>)}
      {!releases.length && <tr><td colSpan={6}>Aucune version.</td></tr>}
    </tbody></table></div>
    <input ref={fileInputRef} type="file" className="visually-hidden" onChange={(event) => {
      const file = event.target.files?.[0];
      const targetId = resumeTargetRef.current;
      event.target.value = "";
      resumeTargetRef.current = null;
      if (file && targetId) {
        const release = releases.find((item) => item.id === targetId);
        if (release) void resume(release, file);
      }
    }} />
  </section>;
}