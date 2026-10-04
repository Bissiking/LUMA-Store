"use client";
import { useState } from "react";
import type { Release } from "@/lib/types";
export function ReleaseEditor({
  release,
  onSave,
  onCancel,
}: {
  release: Release;
  onSave: (patch: Partial<Release>) => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    const body = {
      version: form.get("version"),
      platform: form.get("platform"),
      architecture: form.get("architecture"),
      packageType: form.get("packageType"),
      channel: form.get("channel"),
      distribution: form.get("distribution") || null,
      minimumOs: form.get("minimumOs") || null,
      releaseNotes: form.get("releaseNotes"),
    };
    try {
      const response = await fetch(`/api/admin/releases/${release.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error?.message ?? "Modification impossible.");
      onSave(data.data);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="admin-form review-panel" onSubmit={submit}>
      <h3 className="field-wide">Corriger la version {release.version}</h3>
      <label className="field">
        Version
        <input required name="version" defaultValue={release.version} />
      </label>
      <label className="field">
        Plateforme
        <select name="platform" defaultValue={release.platform}>
          {["windows", "macos", "linux", "android"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Architecture
        <select name="architecture" defaultValue={release.architecture}>
          {["x64", "arm64", "x86", "universal", "other"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Format
        <select name="packageType" defaultValue={release.packageType}>
          {[
            "apk",
            "exe",
            "msi",
            "dmg",
            "deb",
            "rpm",
            "appimage",
            "tar.gz",
            "zip",
          ].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Canal
        <select name="channel" defaultValue={release.channel}>
          {["stable", "beta", "nightly"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Distribution
        <input
          name="distribution"
          maxLength={80}
          defaultValue={release.distribution ?? ""}
        />
      </label>
      <label className="field">
        Système minimum
        <input
          name="minimumOs"
          maxLength={80}
          defaultValue={release.minimumOs ?? ""}
        />
      </label>
      <label className="field field-wide">
        Notes de version
        <textarea
          name="releaseNotes"
          maxLength={40000}
          defaultValue={release.releaseNotes}
        />
      </label>
      <p className="field-wide">
        Fichier original :{" "}
        {release.originalFileName ?? release.fileName ?? "En attente"}
        <br />
        Détection : {release.detectedVersionRaw ?? "—"} ·{" "}
        {release.detectedArchitectureRaw ?? "—"} ·{" "}
        {release.detectedPackageRaw ?? "—"} ·{" "}
        {release.detectedDistributionRaw ?? "—"}
        <br />
        SHA-256 : {release.sha256 ?? "—"}
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="form-actions">
        <button
          type="button"
          className="button button-secondary"
          disabled={busy}
          onClick={onCancel}
        >
          Annuler
        </button>
        <button className="button button-primary" disabled={busy}>
          Enregistrer la correction
        </button>
      </div>
    </form>
  );
}
