import Link from "next/link";
import { redirect } from "next/navigation";
import { AppWindow, FileUp, LayoutDashboard, LogOut } from "lucide-react";
import { getAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin().catch(() => null);
  if (!admin) redirect("/login");
  return <main className="admin-shell">
    <aside className="admin-sidebar"><nav aria-label="Administration">
      <Link href="/admin"><LayoutDashboard size={17} /> Vue d’ensemble</Link>
      <Link href="/admin/apps"><AppWindow size={17} /> Applications</Link>
      <Link href="/admin/releases/new"><FileUp size={17} /> Publier une version</Link>
      <form action="/auth/logout" method="post"><button className="button button-secondary" type="submit"><LogOut size={16} /> Déconnexion</button></form>
    </nav></aside>
    <section className="admin-content">{children}</section>
  </main>;
}
