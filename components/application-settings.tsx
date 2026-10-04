"use client";
import { useState } from "react";
import type { StoreApplication } from "@/lib/types";
export function ApplicationSettings({ app }: { app: StoreApplication }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/admin/apps/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: form.get("status"),
          isFeatured: form.get("featured") === "on",
          minimumVersionsToKeep: form.get("retention")
            ? Number(form.get("retention"))
            : null,
        }),
      });
      const data = await response.json();
      setMessage(
        response.ok
          ? "Paramètres enregistrés."
          : (data.error?.message ?? "Échec de l’enregistrement."),
      );
    } catch {
      setMessage("Connexion indisponible.");
    } finally {
      setBusy(false);
    }
  }
  async function retire() {
    if (
      !confirm(
        `Retirer ${app.name} du catalogue ? Les versions restent conservées.`,
      )
    )
      return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/apps/${app.id}`, {
        method: "DELETE",
      });
      setMessage(response.ok ? "Application retirée." : "Retrait impossible.");
    } catch {
      setMessage("Connexion indisponible.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form className="admin-form" onSubmit={submit}>
        <label className="field">
          Visibilité
          <select name="status" defaultValue={app.status}>
            <option value="draft">Brouillon</option>
            <option value="published">Publiée</option>
            <option value="hidden">Masquée</option>
            <option value="retired">Retirée</option>
          </select>
        </label>
        <label className="field">
          Versions à conserver
          <input
            name="retention"
            type="number"
            min={5}
            max={1000}
            defaultValue={app.minimumVersionsToKeep ?? ""}
            placeholder="Valeur globale"
          />
        </label>
        <label className="field field-wide">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={app.isFeatured}
          />{" "}
          Mettre en avant
        </label>
        <p className="field-wide">
          La version courante et les versions protégées sont conservées.
        </p>
        {message && <p role="status">{message}</p>}
        <button className="button button-primary" disabled={busy}>
          Enregistrer
        </button>
      </form>
      <section className="review-panel">
        <h2>Zone dangereuse</h2>
        <button
          type="button"
          className="button button-danger"
          disabled={busy}
          onClick={() => void retire()}
        >
          Retirer l’application
        </button>
      </section>
    </>
  );
}
