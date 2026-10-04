import Link from "next/link";
import { query } from "@/lib/db";
export default async function MediaLibrary() {
  const result = await query<{ id: string; name: string; count: string }>(
    "SELECT a.id,a.name,count(m.id) FROM applications a LEFT JOIN application_media m ON m.application_id=a.id GROUP BY a.id ORDER BY a.name",
  );
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Médias / Assets</h1>
          <p>Icônes et captures hébergées par le Store.</p>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Application</th>
              <th>Médias</th>
              <th>Gestion</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.count}</td>
                <td>
                  <Link href={`/admin/apps/${row.id}?tab=media`}>
                    Gérer les médias
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
