"use client";

import { useRef, useState } from "react";
import {
  Download,
  Loader2,
  LockKeyhole,
  RotateCcw,
  Trash2,
  UnlockKeyhole,
} from "lucide-react";
import type { Release } from "@/lib/types";
import { formatBytes } from "@/lib/format";
import { ReleaseEditor } from "@/components/release-editor";
import { groupReleases } from "@/lib/release-groups";
import { uploadBinary } from "@/lib/upload";

export function ReleaseManager({
  initialReleases,
}: {
  initialReleases: Release[];
}) {
  const [editing, setEditing] = useState<Release | null>(null);
  const [releases, setReleases] = useState(initialReleases);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeTargetRef = useRef<string | null>(null);

  const pending = releases.filter((release) => release.status === "pending");
  const published = releases.filter(
    (release) => release.status === "published",
  );

  async function protect(release: Release) {
    setError(null);
    const response = await fetch(`/api/admin/releases/${release.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isProtected: !release.isProtected }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error?.message ?? "Modification impossible.");
      return;
    }
    setReleases((items) =>
      items.map((item) =>
        item.id === release.id
          ? { ...item, isProtected: !item.isProtected }
          : item,
      ),
    );
  }

  async function withdraw(release: Release) {
    if (
      !window.confirm(`Retirer définitivement le fichier ${release.fileName} ?`)
    )
      return;
    setError(null);
    const response = await fetch(`/api/admin/releases/${release.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error?.message ?? "Retrait impossible.");
      return;
    }
    setReleases((items) =>
      items.map((item) =>
        item.id === release.id ? { ...item, status: "withdrawn" } : item,
      ),
    );
  }

  function startResume(release: Release) {
    setError(null);
    resumeTargetRef.current = release.id;
    fileInputRef.current?.click();
  }

  async function resume(release: Release, file: File) {
    setBusyId(release.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/releases/${release.id}/resume`, {
        method: "POST",
      });
      const ticket = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(
          ticket?.error?.message ?? "Impossible de reprendre l’envoi.",
        );
      const result = await uploadBinary(ticket.data, file, () => {});
      setReleases((items) =>
        items.map((item) =>
          item.id === release.id
            ? {
                ...item,
                status: "published",
                fileName: result.fileName,
                sizeBytes: result.sizeBytes,
                publishedAt: new Date().toISOString(),
              }
            : item,
        ),
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Échec de la reprise.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function cancelPending(release: Release) {
    if (!window.confirm(`Annuler la version ${release.version} en attente ?`))
      return;
    setError(null);
    const response = await fetch(`/api/admin/releases/${release.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error?.message ?? "Annulation impossible.");
      return;
    }
    setReleases((items) => items.filter((item) => item.id !== release.id));
  }

  async function visibility(release: Release) {
    setError(null);
    setBusyId(release.id);
    try {
      const response = await fetch(`/api/admin/releases/${release.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: release.isPublic === false }),
      });
      if (!response.ok) throw new Error("Modification impossible.");
      setReleases((items) =>
        items.map((item) =>
          item.id === release.id
            ? { ...item, isPublic: release.isPublic === false }
            : item,
        ),
      );
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusyId(null);
    }
  }
  const groups = groupReleases(published);
  const currentIds = new Set(groups[0]?.[1].map((item) => item.id) ?? []);
  return (
    <section className="release-management">
      <h2>Versions</h2>
      {error && (
        <div className="form-message form-message-error" role="alert">
          {error}
        </div>
      )}
      {editing && (
        <ReleaseEditor
          key={editing.id}
          release={editing}
          onCancel={() => setEditing(null)}
          onSave={(patch) => {
            setReleases((items) =>
              items.map((item) =>
                item.id === editing.id ? { ...item, ...patch } : item,
              ),
            );
            setEditing(null);
          }}
        />
      )}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Version</th>
              <th>Cible</th>
              <th>Fichier</th>
              <th>Statut</th>
              <th>Protection</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((release) => (
              <tr key={release.id}>
                <td>
                  <strong>{release.version}</strong>
                  <br />
                  <small>{release.channel}</small>
                </td>
                <td>
                  {release.platform} · {release.architecture}
                </td>
                <td className="status-cell-muted">En attente d’envoi</td>
                <td>
                  <span className="status status-pending">En attente</span>
                </td>
                <td>—</td>
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => startResume(release)}
                      disabled={busyId === release.id}
                      aria-label={`Reprendre l’envoi de ${release.version}`}
                    >
                      {busyId === release.id ? (
                        <Loader2 size={17} className="spin" />
                      ) : (
                        <RotateCcw size={17} />
                      )}
                    </button>
                    <button
                      className="icon-button danger-icon"
                      type="button"
                      onClick={() => cancelPending(release)}
                      disabled={busyId === release.id}
                      aria-label="Annuler la version"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {published
              .filter((release) => currentIds.has(release.id))
              .map((release) => (
                <tr key={release.id}>
                  <td>
                    <strong>{release.version}</strong>
                    <br />
                    <small>{release.channel}</small>
                  </td>
                  <td>
                    {release.platform} · {release.architecture} ·{" "}
                    {release.packageType}
                  </td>
                  <td>
                    {release.fileName}
                    <br />
                    <small>{formatBytes(release.sizeBytes)}</small>
                  </td>
                  <td>
                    <span className="status status-published">
                      {release.isPublic === false ? "Masquée" : "Publiée"}
                    </span>
                  </td>
                  <td>{release.isProtected ? "Protégée" : "Standard"}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="button button-secondary"
                        disabled={busyId === release.id}
                        onClick={() => setEditing(release)}
                      >
                        Modifier
                      </button>
                      <button
                        className="button button-secondary"
                        disabled={busyId === release.id}
                        onClick={() => void visibility(release)}
                      >
                        {release.isPublic === false ? "Afficher" : "Masquer"}
                      </button>
                      <a
                        className="icon-button"
                        href={`/api/v1/downloads/${release.id}`}
                        aria-label={`Télécharger ${release.version}`}
                      >
                        <Download size={17} />
                      </a>
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => protect(release)}
                        aria-label={
                          release.isProtected
                            ? "Retirer la protection"
                            : "Protéger la version"
                        }
                      >
                        {release.isProtected ? (
                          <UnlockKeyhole size={17} />
                        ) : (
                          <LockKeyhole size={17} />
                        )}
                      </button>
                      <button
                        className="icon-button danger-icon"
                        type="button"
                        onClick={() => withdraw(release)}
                        disabled={release.isProtected}
                        aria-label="Retirer la version"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!releases.length && (
              <tr>
                <td colSpan={6}>Aucune version.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {groups.length > 1 && (
        <details className="release-history">
          <summary>Versions précédentes ({groups.length - 1})</summary>
          {groups.slice(1).map(([version, items]) => (
            <details key={version}>
              <summary>
                {version} · {items.length} package(s)
              </summary>
              {items.map((release) => (
                <div className="release-row" key={release.id}>
                  <div>
                    <strong>
                      {release.platform} · {release.architecture} ·{" "}
                      {release.packageType}
                    </strong>
                    <small>
                      {release.isPublic === false ? "Masquée" : "Publiée"} ·{" "}
                      {release.isProtected ? "Protégée" : "Standard"}
                    </small>
                  </div>
                  <div className="row-actions">
                    <button
                      className="button button-secondary"
                      onClick={() => setEditing(release)}
                    >
                      Modifier
                    </button>
                    <button
                      className="button button-secondary"
                      onClick={() => void visibility(release)}
                    >
                      {release.isPublic === false ? "Afficher" : "Masquer"}
                    </button>
                    <a
                      className="button button-secondary"
                      href={`/api/v1/downloads/${release.id}`}
                    >
                      Télécharger
                    </a>
                    <button
                      className="button button-secondary"
                      onClick={() => void protect(release)}
                    >
                      {release.isProtected ? "Déprotéger" : "Protéger"}
                    </button>
                    <button
                      className="button button-danger"
                      disabled={release.isProtected}
                      onClick={() => void withdraw(release)}
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              ))}
            </details>
          ))}
        </details>
      )}
      {releases.some((release) => release.status === "withdrawn") && (
        <details>
          <summary>Versions retirées</summary>
          {releases
            .filter((release) => release.status === "withdrawn")
            .map((release) => (
              <p key={release.id}>
                {release.version} · {release.platform} · {release.architecture}{" "}
                · retirée
              </p>
            ))}
        </details>
      )}
      <input
        ref={fileInputRef}
        type="file"
        className="visually-hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          const targetId = resumeTargetRef.current;
          event.target.value = "";
          resumeTargetRef.current = null;
          if (file && targetId) {
            const release = releases.find((item) => item.id === targetId);
            if (release) void resume(release, file);
          }
        }}
      />
    </section>
  );
}
