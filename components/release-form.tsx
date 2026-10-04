"use client";

import { useState } from "react";
import { CheckCircle2, Plus, Trash2, UploadCloud, XCircle } from "lucide-react";
import { detectRelease } from "@/lib/release-detection";
import { uploadBinary } from "@/lib/upload";

type AppOption = { id: string; name: string };
type RowStatus = "pending" | "uploading" | "done" | "error";

type BinaryRow = {
  id: string;
  platform: string;
  architecture: string;
  packageType: string;
  minimumOs: string;
  distribution: string;
  detected: ReturnType<typeof detectRelease> | null;
  file: File | null;
  status: RowStatus;
  error: string | null;
  pendingId?: string;
};

const defaultPackage: Record<string, string> = {
  windows: "exe",
  macos: "dmg",
  linux: "deb",
  android: "apk",
};

function newRow(): BinaryRow {
  return {
    id: crypto.randomUUID(),
    platform: "windows",
    architecture: "universal",
    packageType: "exe",
    minimumOs: "",
    distribution: "",
    detected: null,
    file: null,
    status: "pending",
    error: null,
  };
}

export function ReleaseForm({
  apps,
  applicationId,
}: {
  apps: AppOption[];
  applicationId?: string;
}) {
  const [selectedApp, setSelectedApp] = useState(applicationId ?? "");
  const [version, setVersion] = useState("");
  const [channel, setChannel] = useState("stable");
  const [notes, setNotes] = useState("");
  const [protectedRelease, setProtectedRelease] = useState(false);
  const [review, setReview] = useState(false);
  const [rows, setRows] = useState<BinaryRow[]>([newRow()]);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  function updateRow(id: string, patch: Partial<BinaryRow>) {
    if (!patch.status) setReview(false);
    setRows((items) =>
      items.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function changePlatform(row: BinaryRow, platform: string) {
    const kept =
      row.packageType === defaultPackage[row.platform] || !row.packageType;
    updateRow(
      row.id,
      kept ? { platform, packageType: defaultPackage[platform] } : { platform },
    );
  }

  function addRow() {
    setReview(false);
    setRows((items) => [...items, newRow()]);
  }

  function removeRow(id: string) {
    setReview(false);
    setRows((items) => items.filter((row) => row.id !== id));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!review) {
      if (!rows.length || rows.some((row) => !row.file?.size)) {
        setMessage({
          type: "error",
          text: "Sélectionnez au moins un fichier.",
        });
        return;
      }
      setReview(true);
      return;
    }
    setLoading(true);
    setMessage(null);
    setProgress(0);
    const form = new FormData(event.currentTarget);
    if (rows.some((row) => !row.file?.size)) {
      setMessage({
        type: "error",
        text: "Sélectionnez un fichier pour chaque plateforme ajoutée.",
      });
      setLoading(false);
      return;
    }
    const base = {
      applicationId: applicationId ?? form.get("applicationId"),
      version: form.get("version"),
      channel: form.get("channel"),
      releaseNotes: form.get("releaseNotes"),
      isProtected: form.get("isProtected") === "on",
    };
    const toUpload = rows.filter((row) => row.status !== "done");
    const total = toUpload.length;
    let done = 0;
    const failures: string[] = [];
    for (const row of toUpload) {
      updateRow(row.id, { status: "uploading", error: null });
      try {
        const create = await fetch(
          row.pendingId
            ? `/api/admin/releases/${row.pendingId}/resume`
            : "/api/admin/releases",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              applicationId: base.applicationId,
              version: base.version,
              channel: base.channel,
              platform: row.platform,
              architecture: row.architecture,
              packageType: row.packageType,
              minimumOs: row.minimumOs || null,
              distribution: row.distribution || null,
              releaseNotes: base.releaseNotes,
              isProtected: base.isProtected,
            }),
          },
        );
        const ticket = await create.json().catch(() => null);
        if (!create.ok)
          throw new Error(ticket?.error?.message ?? "Version invalide.");
        updateRow(row.id, { pendingId: ticket.data.id });
        await uploadBinary(ticket.data, row.file!, (percent) =>
          setProgress(Math.round(((done + percent / 100) / total) * 100)),
        );
        done += 1;
        updateRow(row.id, { status: "done" });
      } catch (error) {
        const detail =
          error instanceof Error ? error.message : "Échec de la publication.";
        updateRow(row.id, { status: "error", error: detail });
        failures.push(`${row.platform} · ${row.packageType}`);
      }
    }
    setLoading(false);
    if (failures.length) {
      setProgress(0);
      setMessage({
        type: "error",
        text: `${done} fichier(s) publié(s), ${failures.length} en échec (${failures.join(", ")}).`,
      });
    } else {
      setProgress(100);
      setMessage({
        type: "success",
        text: `${total} fichier(s) publié(s), empreinte SHA-256 calculée.`,
      });
    }
  }

  return (
    <form
      className="admin-form"
      onSubmit={submit}
      onChange={() => setReview(false)}
    >
      <p className="field-wide" role="status">
        {review
          ? "3 · Résumé et publication"
          : "1 · Choisir les fichiers → 2 · Vérifier les valeurs détectées"}
      </p>
      <div className="field field-wide">
        <label htmlFor="applicationId">Application</label>
        <select
          id="applicationId"
          name="applicationId"
          required
          value={selectedApp}
          onChange={(event) => setSelectedApp(event.target.value)}
          disabled={loading || Boolean(applicationId)}
        >
          <option value="">Sélectionner…</option>
          {apps.map((app) => (
            <option key={app.id} value={app.id}>
              {app.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="version">Version</label>
        <input
          id="version"
          name="version"
          value={version}
          onChange={(event) => {
            setVersion(event.target.value);
            setReview(false);
          }}
          required
          disabled={loading}
          placeholder="1.0.0"
          pattern="v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.\-]+)?"
        />
      </div>
      <div className="field">
        <label htmlFor="channel">Canal</label>
        <select
          value={channel}
          onChange={(event) => setChannel(event.target.value)}
          id="channel"
          name="channel"
          disabled={loading}
        >
          <option value="stable">Stable</option>
          <option value="beta">Bêta</option>
          <option value="nightly">Nightly</option>
        </select>
      </div>
      <div className="field field-wide">
        <label htmlFor="releaseNotes">Notes de version</label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          id="releaseNotes"
          name="releaseNotes"
          disabled={loading}
        />
      </div>
      <div className="field field-wide">
        <label>Binaires par plateforme</label>
        <small>
          Ajoutez un fichier pour chaque système d’exploitation ciblé, puis
          précisez son format et son architecture.
        </small>
        <div className="release-binaries">
          {rows.map((row) => (
            <div className="release-binary-row" key={row.id}>
              <div className="field">
                <label htmlFor={`platform-${row.id}`}>Plateforme</label>
                <select
                  id={`platform-${row.id}`}
                  value={row.platform}
                  disabled={loading || row.status === "done"}
                  onChange={(event) => changePlatform(row, event.target.value)}
                >
                  <option value="windows">Windows</option>
                  <option value="macos">macOS</option>
                  <option value="linux">Linux</option>
                  <option value="android">Android</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor={`architecture-${row.id}`}>Architecture</label>
                <select
                  id={`architecture-${row.id}`}
                  value={row.architecture}
                  disabled={loading || row.status === "done"}
                  onChange={(event) =>
                    updateRow(row.id, { architecture: event.target.value })
                  }
                >
                  <option value="universal">Universelle</option>
                  <option value="x64">x64</option>
                  <option value="arm64">ARM64</option>
                  <option value="x86">x86</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor={`package-${row.id}`}>Format</label>
                <select
                  id={`package-${row.id}`}
                  value={row.packageType}
                  disabled={loading || row.status === "done"}
                  onChange={(event) =>
                    updateRow(row.id, { packageType: event.target.value })
                  }
                >
                  <option>apk</option>
                  <option>exe</option>
                  <option>msi</option>
                  <option>dmg</option>
                  <option>deb</option>
                  <option>rpm</option>
                  <option value="appimage">AppImage</option>
                  <option>tar.gz</option>
                  <option>zip</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor={`os-${row.id}`}>Version système min.</label>
                <input
                  id={`os-${row.id}`}
                  value={row.minimumOs}
                  disabled={loading || row.status === "done"}
                  placeholder="Windows 11, macOS 15…"
                  onChange={(event) =>
                    updateRow(row.id, { minimumOs: event.target.value })
                  }
                />
              </div>
              <div className="field">
                <label htmlFor={`file-${row.id}`}>Fichier</label>
                <input
                  id={`file-${row.id}`}
                  type="file"
                  name="file"
                  disabled={loading || row.status === "done"}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    const detected = file ? detectRelease(file.name) : null;
                    if (detected?.version && !version)
                      setVersion(detected.version);
                    setReview(false);
                    updateRow(row.id, {
                      file,
                      detected,
                      ...(detected?.platform
                        ? { platform: detected.platform }
                        : {}),
                      ...(detected?.architecture
                        ? { architecture: detected.architecture }
                        : {}),
                      ...(detected?.packageType
                        ? { packageType: detected.packageType }
                        : {}),
                      distribution: detected?.distribution ?? "",
                    });
                  }}
                />
              </div>
              <div className="field">
                <label htmlFor={`distribution-${row.id}`}>Distribution</label>
                <input
                  id={`distribution-${row.id}`}
                  value={row.distribution}
                  disabled={loading || row.status === "done"}
                  maxLength={80}
                  onChange={(event) =>
                    updateRow(row.id, { distribution: event.target.value })
                  }
                />
              </div>
              {row.detected && (
                <p className="field-wide">
                  Détection : version{" "}
                  {row.detected.detectedVersionRaw ?? "inconnue"} ? architecture{" "}
                  {row.detected.detectedArchitectureRaw ?? "inconnue"} ? format{" "}
                  {row.detected.detectedPackageRaw ?? "inconnu"}. Vérifiez et
                  corrigez les champs avant de publier.
                </p>
              )}
              <button
                className="icon-button danger-icon"
                type="button"
                disabled={loading || row.status === "done"}
                onClick={() => removeRow(row.id)}
                aria-label="Retirer ce fichier"
              >
                <Trash2 size={17} />
              </button>
              {row.status === "uploading" && (
                <div className="row-status row-status-uploading" role="status">
                  Envoi en cours…
                </div>
              )}
              {row.status === "done" && (
                <div className="row-status row-status-done">
                  <CheckCircle2 size={15} /> Publié
                </div>
              )}
              {row.status === "error" && (
                <div className="row-status row-status-error" role="alert">
                  <XCircle size={15} /> {row.error}
                </div>
              )}
            </div>
          ))}
        </div>
        <button
          className="button button-secondary add-row"
          type="button"
          disabled={loading}
          onClick={addRow}
        >
          <Plus size={17} /> Ajouter une plateforme
        </button>
      </div>
      <div className="field field-wide">
        <label>
          <input
            type="checkbox"
            name="isProtected"
            checked={protectedRelease}
            onChange={(event) => setProtectedRelease(event.target.checked)}
            disabled={loading}
          />{" "}
          Protéger ces versions contre la suppression
        </label>
      </div>
      {loading && (
        <div className="field field-wide">
          <div
            className="upload-progress"
            role="progressbar"
            aria-label="Téléversement des binaires"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          <small>{progress}% envoyé</small>
        </div>
      )}
      {message && (
        <div
          role="alert"
          className={`form-message form-message-${message.type}`}
        >
          {message.text}
        </div>
      )}
      {review && (
        <div className="field-wide review-panel">
          <h2>Résumé</h2>
          <p>
            {apps.find((app) => app.id === selectedApp)?.name ??
              "Application sélectionnée"}{" "}
            · {version}
          </p>
          <p>
            Canal : {channel} ·{" "}
            {protectedRelease ? "Versions protégées" : "Protection standard"}
          </p>
          {notes && <p className="prose">{notes}</p>}
          {rows.map((row) => (
            <p key={row.id}>
              {row.file?.name} · {row.platform} · {row.architecture} ·{" "}
              {row.packageType} · {row.distribution || "Sans distribution"}
            </p>
          ))}
          <button
            type="button"
            className="button button-secondary"
            disabled={loading}
            onClick={() => setReview(false)}
          >
            Revenir à la vérification
          </button>
        </div>
      )}
      <div className="form-actions">
        <button
          className="button button-primary"
          disabled={
            loading ||
            !apps.length ||
            rows.every((row) => row.status === "done")
          }
        >
          <UploadCloud size={18} />{" "}
          {loading
            ? "Publication…"
            : review
              ? "Confirmer la publication"
              : "Vérifier le résumé"}
        </button>
      </div>
    </form>
  );
}
