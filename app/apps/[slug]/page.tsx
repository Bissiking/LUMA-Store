import type { Metadata } from "next";
import Link from "next/link";
import { Download, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { getApplication, listReleases } from "@/lib/store";
import { formatBytes } from "@/lib/format";
import { AppIcon } from "@/components/app-icon";
import { DownloadButton } from "@/components/download-button";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const app = await getApplication((await params).slug).catch(() => null);
  return app ? { title: app.name, description: app.summary } : { title: "Application introuvable" };
}

export default async function AppDetail({ params }: { params: Promise<{ slug: string }> }) {
  const app = await getApplication((await params).slug).catch(() => null);
  if (!app) notFound();
  const releases = await listReleases(app.id);
  return (
    <main className="page-shell"><div className="container">
      <section className="detail-hero">
        <AppIcon name={app.name} iconUrl={app.iconUrl} size={112} />
        <div><h1>{app.name}</h1><span className="verified"><ShieldCheck size={16} /> Publié par {app.publisher}</span><p>{app.summary}</p></div>
        <div className="detail-action"><DownloadButton slug={app.slug} releases={releases} /></div>
      </section>
      <div className="detail-content">
        <article><h2>À propos</h2><div className="prose">{app.description || app.summary}</div><h2 id="releases">Versions disponibles</h2><div className="release-list">
          {releases.map((release) => <div className="release-row" key={release.id}><div><strong>{release.version} · {release.platform}</strong><small>{release.packageType.toUpperCase()} · {release.architecture} · {formatBytes(release.sizeBytes)}</small></div><Link href={`/api/v1/downloads/${release.id}`} className="button button-secondary" aria-label={`Télécharger ${app.name} ${release.version} pour ${release.platform}`}><Download size={16} /> Télécharger</Link></div>)}
          {!releases.length && <p className="prose">Aucun binaire n’a encore été publié.</p>}
        </div></article>
        <aside><h2>Informations</h2><dl className="info-list"><div><dt>Éditeur</dt><dd>{app.publisher}</dd></div><div><dt>Catégorie</dt><dd>{app.category}</dd></div><div><dt>Plateformes</dt><dd>{app.platforms.join(", ") || "—"}</dd></div><div><dt>Intégrité</dt><dd>SHA-256</dd></div></dl></aside>
      </div>
    </div></main>
  );
}
