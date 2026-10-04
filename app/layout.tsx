import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Search, ShieldCheck } from "lucide-react";
import { version } from "@/package.json";
import "./globals.css";

const bodyFont = Manrope({ subsets: ["latin"], variable: "--font-body" });
const displayFont = Sora({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: { default: "LUMA Store", template: "%s — LUMA Store" },
  description: "Le catalogue officiel des applications de l'écosystème LUMA.",
  icons: { icon: "/icon.png", apple: "/icon-192.png" },
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = { themeColor: "#f7f7fb", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>
        <span className="design-contract" aria-hidden="true" dangerouslySetInnerHTML={{ __html: `<!--
          THESIS: Un store familier qui rend compatibilité et intégrité plus visibles que la promotion; il refuse le catalogue publicitaire.
          OWN-WORLD: Surfaces minérales, encre aubergine, iris LUMA; rails illustrés, icônes optiques et contrôles natifs.
          STORY: Le visiteur identifie la source officielle, filtre sa plateforme, choisit une application et télécharge une version vérifiable.
          FIRST VIEWPORT: Recherche centrée, introduction compacte et premier rail d'applications visible; l'action primaire ouvre le catalogue.
          FORM: Canon store contemporain, position de sortie permanente; repères Microsoft Store et Google Play; seed ac914e78.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
        -->` }} />
        <header className="site-header">
          <div className="header-inner">
            <Link className="brand" href="/" aria-label="Accueil LUMA Store">
              <Image src="/luma-store-logo.png" alt="" width={42} height={42} priority />
              <span>LUMA <b>Store</b></span>
            </Link>
            <form className="header-search" action="/" role="search">
              <Search size={18} aria-hidden="true" />
              <input name="q" type="search" placeholder="Rechercher une application" aria-label="Rechercher dans le catalogue" />
            </form>
            <nav className="header-nav" aria-label="Navigation principale">
              <Link href="/#applications">Applications</Link>
              <Link className="admin-link" href="/admin"><ShieldCheck size={17} /> Administration</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div><span className="footer-mark">L</span><p><strong>LUMA Store {version}</strong><br />Distribution logicielle vérifiée.</p></div>
          <nav aria-label="Liens de pied de page"><Link href="/docs/api">API</Link><Link href="/health">État du service</Link></nav>
        </footer>
      </body>
    </html>
  );
}
