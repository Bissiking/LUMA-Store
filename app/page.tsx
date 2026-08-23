import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Boxes, CheckCircle2, Download, Laptop, PackageCheck, Smartphone, Terminal } from "lucide-react";
import { listApplicationsOrNull } from "@/lib/store";
import type { Platform, StoreApplication } from "@/lib/types";
import { AppCard } from "@/components/app-card";

const demoApps: StoreApplication[] = [
  { id: "demo-1", slug: "luma-agent", name: "LUMA Agent", summary: "Supervision et maintenance des machines de l'écosystème.", description: "", publisher: "LUMA", iconUrl: null, category: "Infrastructure", status: "published", isFeatured: true, platforms: ["windows", "linux"], latestVersion: null, updatedAt: new Date().toISOString() },
  { id: "demo-2", slug: "orbis", name: "Orbis", summary: "Déployez et pilotez vos services depuis une interface unifiée.", description: "", publisher: "LUMA", iconUrl: null, category: "Développement", status: "published", isFeatured: true, platforms: ["linux"], latestVersion: null, updatedAt: new Date().toISOString() },
  { id: "demo-3", slug: "nino-player", name: "Nino Player", summary: "Un lecteur musical conçu pour l'écosystème LUMA.", description: "", publisher: "LUMA", iconUrl: null, category: "Multimédia", status: "published", isFeatured: false, platforms: ["windows", "macos", "android"], latestVersion: null, updatedAt: new Date().toISOString() }
];

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; platform?: string }> }) {
  const filters = await searchParams;
  const platform = (["windows", "macos", "linux", "android"] as const).find((value) => value === filters.platform);
  let apps: StoreApplication[] = [];
  let demo = false;
  const storedApps = await listApplicationsOrNull({ publicOnly: true, query: filters.q?.slice(0, 100), category: filters.category?.slice(0, 60), platform: platform as Platform | undefined });
  if (storedApps) {
    apps = storedApps;
  } else if (process.env.NODE_ENV === "development") {
    apps = demoApps.filter((app) => (!filters.q || `${app.name} ${app.summary}`.toLowerCase().includes(filters.q.toLowerCase())) && (!platform || app.platforms.includes(platform)));
    demo = true;
  }
  const categories = [...new Set(apps.map((app) => app.category))];
  const featured = apps.filter((app) => app.isFeatured);
  return (
    <main>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <h1>Vos applications. <span>Au bon endroit.</span></h1>
            <p>Téléchargez les applications de l’écosystème LUMA pour Windows, macOS, Linux et Android. Chaque version est vérifiée avant sa mise à disposition.</p>
            <div className="hero-actions">
              <Link href="#applications" className="button button-primary">Explorer le catalogue <ArrowRight size={18} /></Link>
              <Link href="/docs/api" className="button button-secondary">Intégrer les mises à jour</Link>
            </div>
          </div>
          <div className="hero-stage" aria-label="LUMA Store distribue les applications vers quatre plateformes">
            <div className="hero-orbit" />
            <Image className="hero-logo" src="/luma-store-logo.png" alt="Logo LUMA Store" width={420} height={420} priority />
            <span className="platform-float"><Laptop size={18} /> Windows</span>
            <span className="platform-float"><Boxes size={18} /> macOS</span>
            <span className="platform-float"><Terminal size={18} /> Linux</span>
            <span className="platform-float"><Smartphone size={18} /> Android</span>
          </div>
        </div>
      </section>
      <section className="catalog" id="applications">
        <div className="container">
          <div className="section-heading"><div><h2>Applications</h2><p>Les outils qui composent l’écosystème LUMA.</p></div>{filters.q && <Link href="/" className="button button-secondary">Effacer la recherche</Link>}</div>
          {demo && <p className="demo-note">Aperçu local : PostgreSQL n’est pas disponible. Ces fiches servent uniquement à prévisualiser l’interface.</p>}
          <nav className="platform-filters" aria-label="Filtrer par plateforme">
            <Link href="/#applications" aria-current={!platform}>Toutes les plateformes</Link>
            {(["windows", "macos", "linux", "android"] as const).map((value) => <Link key={value} href={`/?platform=${value}#applications`} aria-current={platform === value}>{value === "macos" ? "macOS" : value[0].toUpperCase() + value.slice(1)}</Link>)}
          </nav>
          <nav className="category-row" aria-label="Filtrer par catégorie">
            <Link className="category-chip" href={platform ? `/?platform=${platform}#applications` : "/#applications"} aria-current={!filters.category}>Toutes les catégories</Link>
            {categories.map((category) => <Link className="category-chip" key={category} href={`/?category=${encodeURIComponent(category)}${platform ? `&platform=${platform}` : ""}#applications`} aria-current={filters.category === category}>{category}</Link>)}
          </nav>
          {featured.length > 0 && <section className="catalog-rail"><h3>À la une</h3><div className="app-grid">{featured.map((app) => <AppCard key={`featured-${app.id}`} app={app} />)}</div></section>}
          <section className="catalog-rail"><h3>Tout l’écosystème</h3><div className="app-grid">
            {apps.map((app) => <AppCard key={app.id} app={app} />)}
            {!apps.length && <div className="empty-state"><div><h3>Aucune application trouvée</h3><p>Modifiez votre recherche ou revenez voir le catalogue complet.</p></div></div>}
          </div></section>
        </div>
      </section>
      <section className="trust-strip" aria-label="Garanties de distribution">
        <div className="container">
          <div className="trust-item"><PackageCheck /><div><strong>Intégrité contrôlée</strong><span>Empreinte SHA-256 publiée</span></div></div>
          <div className="trust-item"><Download /><div><strong>Téléchargement direct</strong><span>Reprise des fichiers volumineux</span></div></div>
          <div className="trust-item"><CheckCircle2 /><div><strong>Source officielle</strong><span>Versions publiées par LUMA</span></div></div>
        </div>
      </section>
    </main>
  );
}
