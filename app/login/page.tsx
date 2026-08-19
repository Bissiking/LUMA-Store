import Image from "next/image";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";

const errors: Record<string, string> = {
  kyros_not_configured: "Le SSO Kyros n'est pas encore configuré sur ce serveur.",
  invalid_callback: "La réponse de Kyros est incomplète.",
  invalid_state: "La tentative de connexion a expiré ou n'est pas valide.",
  access_denied: "Kyros n'a pas confirmé un accès administrateur.",
  rate_limited: "Trop de tentatives. Réessayez dans une minute."
};

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const error = errors[(await searchParams).error ?? ""];
  return <main className="login-shell"><section className="login-panel">
    <Image src="/luma-store-logo.png" alt="" width={96} height={96} />
    <h1>Administration</h1><p>Connectez-vous avec un compte administrateur Kyros pour gérer le catalogue et publier des versions.</p>
    {error && <div className="login-error" role="alert">{error}</div>}
    <Link href="/auth/login" className="button button-primary"><LockKeyhole size={18} /> Continuer avec Kyros</Link>
  </section></main>;
}
