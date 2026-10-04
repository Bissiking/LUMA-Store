import { config } from "@/lib/config";
import { version } from "@/package.json";
import { formatBytes } from "@/lib/format";
export default function StoreSettings() {
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Paramètres du Store</h1>
          <p>
            Configuration active. Les valeurs globales sont gérées par
            l’environnement du serveur.
          </p>
        </div>
      </div>
      <div className="settings-grid">
        <section>
          <h2>Général</h2>
          <p>LUMA Store {version}</p>
          <p>{config.PUBLIC_BASE_URL}</p>
        </section>
        <section>
          <h2>Distribution</h2>
          <p>Taille maximale : {formatBytes(config.MAX_ARTIFACT_SIZE_BYTES)}</p>
          <p>
            Rétention minimale : {config.MIN_VERSIONS_TO_KEEP} versions par
            application.
          </p>
        </section>
        <section>
          <h2>Stockage</h2>
          <p>Stockage local géré par le serveur.</p>
          <p>Images PNG / WEBP : 10 Mo maximum.</p>
        </section>
        <section>
          <h2>Mises à jour</h2>
          <p>
            Canaux stable, bêta et nightly. Sélection par plateforme et
            architecture.
          </p>
        </section>
        <section>
          <h2>Sécurité / Kyros</h2>
          <p>
            {config.kyrosConfigured
              ? "Kyros configuré"
              : "Kyros non configuré : administration fermée"}
          </p>
          <p>Durée des sessions : {config.SESSION_TTL_HOURS} heures.</p>
        </section>
      </div>
    </>
  );
}
