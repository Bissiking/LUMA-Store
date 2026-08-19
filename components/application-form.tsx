"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Save } from "lucide-react";
import type { StoreApplication } from "@/lib/types";

export function ApplicationForm({ app }: { app?: StoreApplication }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage(null);
    const form = new FormData(event.currentTarget);
    const raw = Object.fromEntries(form);
    const body = { ...raw, iconUrl: raw.iconUrl || null, isFeatured: form.get("isFeatured") === "on" };
    const response = await fetch(app ? `/api/admin/apps/${app.id}` : "/api/admin/apps", { method: app ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json().catch(() => null);
    if (!response.ok) { setMessage({ type: "error", text: result?.error?.message ?? "Création impossible." }); setLoading(false); return; }
    setMessage({ type: "success", text: app ? "Application mise à jour." : "Application créée." }); router.push("/admin/apps"); router.refresh();
  }
  async function retire() {
    if (!app || !window.confirm(`Retirer ${app.name} du catalogue public ? Les versions restent dans l'historique.`)) return;
    setLoading(true); const response = await fetch(`/api/admin/apps/${app.id}`, { method: "DELETE" });
    setLoading(false); if (!response.ok) { const data = await response.json().catch(() => null); setMessage({ type: "error", text: data?.error?.message ?? "Retrait impossible." }); return; }
    router.push("/admin/apps"); router.refresh();
  }
  return <form className="admin-form" onSubmit={submit}>
    <div className="field"><label htmlFor="name">Nom</label><input id="name" name="name" required minLength={2} maxLength={120} autoComplete="off" defaultValue={app?.name} /></div>
    <div className="field"><label htmlFor="slug">Identifiant URL</label><input id="slug" name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="luma-agent" autoComplete="off" defaultValue={app?.slug} /></div>
    <div className="field field-wide"><label htmlFor="summary">Résumé</label><input id="summary" name="summary" required minLength={10} maxLength={180} defaultValue={app?.summary} /></div>
    <div className="field field-wide"><label htmlFor="description">Description</label><textarea id="description" name="description" maxLength={20000} defaultValue={app?.description} /></div>
    <div className="field"><label htmlFor="publisher">Éditeur</label><input id="publisher" name="publisher" defaultValue={app?.publisher ?? "LUMA"} required /></div>
    <div className="field"><label htmlFor="category">Catégorie</label><input id="category" name="category" defaultValue={app?.category ?? "Outils"} required /></div>
    <div className="field"><label htmlFor="iconUrl">URL de l’icône</label><input id="iconUrl" name="iconUrl" type="url" placeholder="https://…" defaultValue={app?.iconUrl ?? ""} /></div>
    <div className="field"><label htmlFor="status">État</label><select id="status" name="status" defaultValue={app?.status ?? "draft"}><option value="draft">Brouillon</option><option value="published">Publié</option><option value="retired">Retiré</option></select></div>
    <div className="field field-wide"><label><input type="checkbox" name="isFeatured" defaultChecked={app?.isFeatured} /> Mettre cette application en avant</label></div>
    {message && <div role="alert" className={`form-message form-message-${message.type}`}>{message.text}</div>}
    <div className="form-actions">{app && app.status !== "retired" && <button className="button button-danger" type="button" disabled={loading} onClick={retire}><Archive size={17} /> Retirer</button>}<button className="button button-primary" disabled={loading}><Save size={17} /> {loading ? "Enregistrement…" : app ? "Enregistrer" : "Créer l’application"}</button></div>
  </form>;
}
