import Link from "next/link";
import { Plus } from "lucide-react";
import { listApplications } from "@/lib/store";

export default async function AdminApps() {
  const apps = await listApplications({ publicOnly: false });
  return <><div className="admin-heading"><div><h1>Applications</h1><p>Publiez, masquez et organisez les applications.</p></div><Link href="/admin/apps/new" className="button button-primary"><Plus size={18} /> Nouvelle application</Link></div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nom</th><th>Identifiant</th><th>Catégorie</th><th>Versions</th><th>État</th><th></th></tr></thead><tbody>{apps.map((app) => <tr key={app.id}><td><strong>{app.name}</strong></td><td><code>{app.slug}</code></td><td>{app.category}</td><td>{app.latestVersion ?? "Aucune"}</td><td><span className={`status status-${app.status}`}>{app.status}</span></td><td><Link className="table-link" href={`/admin/apps/${app.id}`}>Modifier</Link></td></tr>)}</tbody></table></div>
  </>;
}
