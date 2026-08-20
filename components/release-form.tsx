"use client";

import { useState } from "react";
import { CheckCircle2, Plus, Trash2, UploadCloud, XCircle } from "lucide-react";
import { uploadBinary } from "@/lib/upload";

type AppOption = { id: string; name: string };
type RowStatus = "pending" | "uploading" | "done" | "error";

type BinaryRow = {
  id: string;
  platform: string;
  architecture: string;
  packageType: string;
  minimumOs: string;
  file: File | null;
  status: RowStatus;
  error: string | null;
};

const defaultPackage: Record<string, string> = { windows: "exe", macos: "dmg", linux: "deb", android: "apk" };

function newRow(): BinaryRow {
  return { id: crypto.randomUUID(), platform: "windows", architecture: "universal", packageType: "exe", minimumOs: "", file: null, status: "pending", error: null };
}

export function ReleaseForm({ apps }: { apps: AppOption[] }) {
  const [rows, setRows] = useState<BinaryRow[]>([newRow()]);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  function updateRow(id: string, patch: Partial<BinaryRow>) {
    setRows((items) => items.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function changePlatform(row: BinaryRow, platform: string) {
    const kept = row.packageType === defaultPackage[row.platform] || !row.packageType;
    updateRow(row.id, kept ? { platform, packageType: defaultPackage[platform] } : { platform });
  }

  function addRow() {
    setRows((items) => [...items, newRow()]);
  }

  function removeRow(id: string) {
    setRows((items) => items.filter((row) => row.id !== id));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setMessage(null); setProgress(0);
    const form = new FormData(event.currentTarget);
    if (rows.some((row) => !row.file?.size)) {
      setMessage({ type: "error", text: "Sélectionnez un fichier pour chaque plateforme ajoutée." });
      setLoading(false); return;
    }
    const base = {
      applicationId: form.get("applicationId"), version: form.get("version"), channel: form.get("channel"),
      releaseNotes: form.get("releaseNotes"), isProtected: form.get("isProtected") === "on"
    };
    const total = rows.length;
    let done = 0;
    const failures: string[] = [];
    for (const row of rows) {
      updateRow(row.id, { status: "uploading", error: null });
      try {
        const create = await fetch("/api/admin/releases", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId: base.applicationId, version: base.version, channel: base.channel,
            platform: row.platform, architecture: row.architecture, packageType: row.packageType,
            minimumOs: row.minimumOs || null, releaseNotes: base.releaseNotes, isProtected: base.isProtected
          })
        });
        const ticket = await create.json().catch(() => null);
        if (!create.ok) throw new Error(ticket?.error?.message ?? "Version invalide.");
        await uploadBinary(ticket.data, row.file!, (percent) => setProgress(Math.round(((done + percent / 100) / total) * 100)));
        done += 1;
        updateRow(row.id, { status: "done" });
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Échec de la publication.";
        updateRow(row.id, { status: "error", error: detail });
        failures.push(`${row.platform} · ${row.packageType}`);
      }
    }
    setLoading(false);
    if (failures.length) {
      setProgress(0);
      setMessage({ type: "error", text: `${done} fichier(s) publié(s), ${failures.length} en échec (${failures.join(", ")}).` });
    } else {
      setProgress(100);
      setMessage({ type: "success", text: `${total} fichier(s) publié(s), empreinte SHA-256 calculée.` });
    }
  }

  return <form className="admin-form" onSubmit={submit}>
    <div className="field field-wide"><label htmlFor="applicationId">Application</label><select id="applicationId" name="applicationId" required disabled={loading}><option value="">Sélectionner…</option>{apps.map((app) => <option key={app.id} value={app.id}>{app.name}</option>)}</select></div>
    <div className="field"><label htmlFor="version">Version</label><input id="version" name="version" required disabled={loading} placeholder="1.0.0" pattern="v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.\-]+)?" /></div>
    <div className="field"><label htmlFor="channel">Canal</label><select id="channel" name="channel" disabled={loading}><option value="stable">Stable</option><option value="beta">Bêta</option><option value="nightly">Nightly</option></select></div>
    <div className="field field-wide"><label htmlFor="releaseNotes">Notes de version</label><textarea id="releaseNotes" name="releaseNotes" disabled={loading} /></div>
    <div className="field field-wide">
      <label>Binaires par plateforme</label>
      <small>Ajoutez un fichier pour chaque système d’exploitation ciblé, puis précisez son format et son architecture.</small>
      <div className="release-binaries">
        {rows.map((row) => <div className="release-binary-row" key={row.id}>
          <div className="field"><label>Plateforme</label><select value={row.platform} disabled={loading} onChange={(event) => changePlatform(row, event.target.value)}><option value="windows">Windows</option><option value="macos">macOS</option><option value="linux">Linux</option><option value="android">Android</option></select></div>
          <div className="field"><label>Architecture</label><select value={row.architecture} disabled={loading} onChange={(event) => updateRow(row.id, { architecture: event.target.value })}><option value="universal">Universelle</option><option value="x64">x64</option><option value="arm64">ARM64</option></select></div>
          <div className="field"><label>Format</label><select value={row.packageType} disabled={loading} onChange={(event) => updateRow(row.id, { packageType: event.target.value })}><option>apk</option><option>exe</option><option>msi</option><option>dmg</option><option>deb</option><option>rpm</option><option value="appimage">AppImage</option><option>tar.gz</option><option>zip</option></select></div>
          <div className="field"><label>Version système min.</label><input value={row.minimumOs} disabled={loading} placeholder="Windows 11, macOS 15…" onChange={(event) => updateRow(row.id, { minimumOs: event.target.value })} /></div>
          <div className="field"><label>Fichier</label><input type="file" name="file" disabled={loading} onChange={(event) => updateRow(row.id, { file: event.target.files?.[0] ?? null })} /></div>
          <button className="icon-button danger-icon" type="button" disabled={loading} onClick={() => removeRow(row.id)} aria-label="Retirer ce fichier"><Trash2 size={17} /></button>
          {row.status === "uploading" && <div className="row-status row-status-uploading" role="status">Envoi en cours…</div>}
          {row.status === "done" && <div className="row-status row-status-done"><CheckCircle2 size={15} /> Publié</div>}
          {row.status === "error" && <div className="row-status row-status-error" role="alert"><XCircle size={15} /> {row.error}</div>}
        </div>)}
      </div>
      <button className="button button-secondary add-row" type="button" disabled={loading} onClick={addRow}><Plus size={17} /> Ajouter une plateforme</button>
    </div>
    <div className="field field-wide"><label><input type="checkbox" name="isProtected" disabled={loading} /> Protéger ces versions contre la suppression</label></div>
    {loading && <div className="field field-wide"><div className="upload-progress" role="progressbar" aria-label="Téléversement des binaires" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div><small>{progress}% envoyé</small></div>}
    {message && <div role="alert" className={`form-message form-message-${message.type}`}>{message.text}</div>}
    <div className="form-actions"><button className="button button-primary" disabled={loading || !apps.length}><UploadCloud size={18} /> {loading ? "Publication…" : "Publier les versions"}</button></div>
  </form>;
}