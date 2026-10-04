"use client";
import Image from "next/image";
import { useState } from "react";
import type { ApplicationMedia } from "@/lib/types";

export function MediaManager({
  applicationId,
  initialMedia,
}: {
  applicationId: string;
  initialMedia: ApplicationMedia[];
}) {
  const [media, setMedia] = useState(initialMedia);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  async function upload(files: FileList | null, kind: string) {
    if (!files?.length || busy) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files).slice(
        0,
        kind === "icon" ? 1 : files.length,
      )) {
        const response = await fetch(
          `/api/admin/apps/${applicationId}/media?kind=${kind}`,
          {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          },
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error?.message ?? "Upload impossible.");
        setMedia(data.data);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Upload impossible.");
    } finally {
      setBusy(false);
    }
  }
  async function patch(item: ApplicationMedia, body: Record<string, unknown>) {
    const response = await fetch(`/api/admin/media/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Enregistrement impossible.");
  }
  async function save(item: ApplicationMedia) {
    setBusy(true);
    setError(null);
    try {
      await patch(item, { caption: item.caption, platform: item.platform });
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(item: ApplicationMedia) {
    if (!confirm("Supprimer cette image ?")) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/media/${item.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Suppression impossible.");
      setMedia((items) => items.filter((value) => value.id !== item.id));
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function move(id: string, target: string) {
    const screenshots = media.filter((item) => item.kind === "screenshot");
    const from = screenshots.findIndex((item) => item.id === id),
      to = screenshots.findIndex((item) => item.id === target);
    if (busy || from < 0 || to < 0 || from === to) return;
    screenshots.splice(to, 0, screenshots.splice(from, 1)[0]);
    setBusy(true);
    setError(null);
    try {
      for (const [sortOrder, item] of screenshots.entries())
        await patch(item, { sortOrder });
      setMedia([
        ...media.filter((item) => item.kind === "icon"),
        ...screenshots.map((item, sortOrder) => ({ ...item, sortOrder })),
      ]);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function edit(id: string, body: Partial<ApplicationMedia>) {
    setMedia((items) =>
      items.map((item) => (item.id === id ? { ...item, ...body } : item)),
    );
  }
  return (
    <section aria-label="Gestion des médias">
      {error && (
        <p className="form-message form-message-error" role="alert">
          {error}
        </p>
      )}
      {busy && <p role="status">Enregistrement en cours…</p>}
      <h2>Icône</h2>
      <p>PNG ou WEBP, 10 Mo maximum. Une image carrée est recommandée.</p>
      <label className="field">
        Importer ou remplacer l’icône
        <input
          type="file"
          accept="image/png,image/webp"
          disabled={busy}
          onChange={(event) => {
            void upload(event.target.files, "icon");
            event.target.value = "";
          }}
        />
      </label>
      {media
        .filter((item) => item.kind === "icon")
        .map((item) => (
          <div className="media-card" key={item.id}>
            <Image
              src={item.url}
              alt="Icône actuelle"
              width={100}
              height={100}
              unoptimized
            />
            <button
              className="button button-danger"
              disabled={busy}
              onClick={() => void remove(item)}
            >
              Supprimer l’icône
            </button>
          </div>
        ))}
      <h2>Captures d’écran</h2>
      <div
        className="media-drop"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (event.dataTransfer.files.length)
            void upload(event.dataTransfer.files, "screenshot");
        }}
      >
        <label>
          Déposez les images ici ou sélectionnez plusieurs fichiers
          <input
            type="file"
            accept="image/png,image/webp"
            multiple
            disabled={busy}
            onChange={(event) => {
              void upload(event.target.files, "screenshot");
              event.target.value = "";
            }}
          />
        </label>
      </div>
      <div className="media-grid">
        {media
          .filter((item) => item.kind === "screenshot")
          .map((item, index, items) => (
            <article
              className="media-card"
              key={item.id}
              draggable={!busy}
              onDragStart={() => setDragged(item.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (dragged) void move(dragged, item.id);
                setDragged(null);
              }}
            >
              <Image
                src={item.url}
                alt={item.caption || `Capture ${index + 1}`}
                width={320}
                height={200}
                unoptimized
              />
              <label>
                Légende
                <input
                  maxLength={300}
                  disabled={busy}
                  value={item.caption}
                  onChange={(event) =>
                    edit(item.id, { caption: event.target.value })
                  }
                />
              </label>
              <label>
                Plateforme
                <select
                  disabled={busy}
                  value={item.platform ?? ""}
                  onChange={(event) =>
                    edit(item.id, {
                      platform: (event.target.value ||
                        null) as ApplicationMedia["platform"],
                    })
                  }
                >
                  <option value="">Toutes</option>
                  {["windows", "macos", "linux", "android"].map((platform) => (
                    <option key={platform}>{platform}</option>
                  ))}
                </select>
              </label>
              <div className="row-actions">
                <button
                  className="button button-secondary"
                  disabled={busy || index === 0}
                  onClick={() => void move(item.id, items[index - 1].id)}
                >
                  Monter
                </button>
                <button
                  className="button button-secondary"
                  disabled={busy || index === items.length - 1}
                  onClick={() => void move(item.id, items[index + 1].id)}
                >
                  Descendre
                </button>
                <button
                  className="button button-primary"
                  disabled={busy}
                  onClick={() => void save(item)}
                >
                  Enregistrer
                </button>
                <button
                  className="button button-danger"
                  disabled={busy}
                  onClick={() => void remove(item)}
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}
