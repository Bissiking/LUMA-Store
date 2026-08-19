import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { listApplications } from "@/lib/store";
import { getAdmin } from "@/lib/auth";

export default async function AdminDashboard() {
  const [admin, apps] = await Promise.all([getAdmin(), listApplications({ publicOnly: false })]);
  return <>
    <div className="admin-heading"><div><h1>Bonjour, {admin?.displayName}</h1><p>Le catalogue contient {apps.length} application{apps.length > 1 ? "s" : ""}.</p></div><Link href="/admin/apps/new" className="button button-primary"><PackagePlus size={18} /> Ajouter une application</Link></div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Application</th><th>Catégorie</th><th>Plateformes</th><th>Dernière version</th><th>État</th><th></th></tr></thead><tbody>
      {apps.map((app) => <tr key={app.id}><td><strong>{app.name}</strong><br /><small>/{app.slug}</small></td><td>{app.category}</td><td>{app.platforms.join(", ") || "—"}</td><td>{app.latestVersion ?? "—"}</td><td><span className={`status status-${app.status}`}>{app.status}</span></td><td><Link className="table-link" href={`/admin/apps/${app.id}`}>Modifier / versions</Link></td></tr>)}
      {!apps.length && <tr><td colSpan={6}>Aucune application. Créez la première fiche du catalogue.</td></tr>}
    </tbody></table></div>
  </>;
}
