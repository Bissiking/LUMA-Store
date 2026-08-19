import Link from "next/link";

export default function NotFound() {
  return <main className="login-shell"><div className="login-panel"><span className="footer-mark" style={{ margin: "0 auto 16px" }}>L</span><h1>Page introuvable</h1><p>Cette application ou cette page n’existe pas, ou n’est plus publiée.</p><Link className="button button-primary" href="/">Retour au catalogue</Link></div></main>;
}
