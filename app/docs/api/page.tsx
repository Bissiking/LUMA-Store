export const metadata = { title: "API de mise à jour" };

const updateRequest = `GET /api/v1/apps/harmonix/updates
  ?current_version=1.4.0
  &platform=android
  &arch=universal
  &channel=stable`;

const downloadRequest = `GET /api/v1/apps/harmonix/download`;

const targetedDownloadRequest = `GET /api/v1/apps/harmonix/download
  ?platform=macos&arch=arm64&channel=stable`;

const packagesRequest = `GET /api/v1/apps/harmonix/packages`;

const packagesResponse = `{
  "data": {
    "slug": "harmonix",
    "name": "Harmonix",
    "packages": [
      {
        "version": "1.5.0",
        "channel": "stable",
        "platform": "android",
        "architecture": "arm64",
        "packageType": "apk",
        "fileName": "harmonix-1.5.0.apk",
        "sizeBytes": 28746123,
        "sha256": "empreinte-sha256",
        "downloadUrl": "https://store.example/api/v1/downloads/release-uuid"
      },
      {
        "version": "1.5.0",
        "channel": "stable",
        "platform": "windows",
        "architecture": "x64",
        "packageType": "exe",
        "fileName": "harmonix-1.5.0-x64.exe",
        "sizeBytes": 52428800,
        "sha256": "empreinte-sha256",
        "downloadUrl": "https://store.example/api/v1/downloads/release-uuid"
      }
    ]
  },
  "meta": { "count": 6, "apiVersion": "v1" }
}`;

const availableResponse = `{
  "data": {
    "available": true,
    "currentVersion": "1.4.0",
    "version": "1.5.0",
    "releaseNotes": "Corrections et améliorations.",
    "publishedAt": "2026-08-19T12:00:00.000Z",
    "artifact": {
      "id": "release-uuid",
      "fileName": "harmonix-1.5.0.apk",
      "size": 28746123,
      "sha256": "empreinte-sha256",
      "url": "https://store.example/api/v1/downloads/release-uuid"
    }
  },
  "meta": { "apiVersion": "v1" }
}`;

const unavailableResponse = `{
  "data": {
    "available": false,
    "currentVersion": "1.5.0"
  },
  "meta": { "apiVersion": "v1" }
}`;

const typescriptExample = `const params = new URLSearchParams({
  current_version: "1.4.0",
  platform: "android",
  arch: "universal",
  channel: "stable",
});

const response = await fetch(
  \`https://store.example/api/v1/apps/harmonix/updates?\${params}\`
);

if (!response.ok) {
  throw new Error(\`LUMA Store a répondu \${response.status}\`);
}

const result = await response.json();

if (result.data.available) {
  console.log(result.data.version);
  console.log(result.data.artifact.url);
}`;

export default function ApiDocs() {
  return <main className="page-shell"><div className="container docs-layout">
    <nav className="docs-nav" aria-label="Sommaire de l’API">
      <a href="#demarrage">Démarrage rapide</a>
      <a href="#telechargement">Téléchargement auto</a>
      <a href="#packages">Liste des packages</a>
      <a href="#parametres">Paramètres</a>
      <a href="#reponses">Réponses</a>
      <a href="#integration">Intégration</a>
      <a href="#endpoints">Endpoints</a>
      <a href="#erreurs">Erreurs</a>
    </nav>

    <article className="docs-content">
      <header className="docs-intro">
        <h1>API de mise à jour</h1>
        <p>Une application interroge LUMA Store avec sa version actuelle. L’API répond avec la dernière version compatible et l’URL de son fichier.</p>
        <div className="docs-facts" aria-label="Caractéristiques de l’API">
          <span>API publique</span><span>Version v1</span><span>Intégrité SHA-256</span>
        </div>
      </header>

      <section id="demarrage">
        <h2>Démarrage rapide avec Harmonix</h2>
        <p>Le slug <code>harmonix</code> identifie l’application dans le Store. Cet exemple cherche une mise à jour Android stable à partir de la version <code>1.4.0</code>.</p>
        <pre><code>{updateRequest}</code></pre>
        <p className="docs-note">Aucune clé API n’est nécessaire. Utilisez l’adresse publique de votre instance LUMA Store comme domaine.</p>
      </section>

      <section id="telechargement">
        <h2>Téléchargement automatique</h2>
        <p>L’endpoint <code>/download</code> fonctionne sans paramètre : il détecte le système d’exploitation du visiteur et redirige vers le binaire stable correspondant.</p>
        <pre><code>{downloadRequest}</code></pre>
        <p>Pour cibler précisément un package, trois paramètres optionnels et uniquement ceux-ci sont acceptés :</p>
        <pre><code>{targetedDownloadRequest}</code></pre>
        <div className="docs-table-wrap"><table className="docs-table">
          <thead><tr><th>Paramètre</th><th>Obligatoire</th><th>Valeurs</th></tr></thead>
          <tbody>
            <tr><td><code>platform</code></td><td>Non</td><td><code>windows</code>, <code>macos</code>, <code>linux</code> ou <code>android</code>. Détecté depuis le User-Agent si absent.</td></tr>
            <tr><td><code>arch</code></td><td>Non</td><td><code>x64</code>, <code>arm64</code> ou <code>universal</code>. Détectée si possible, sinon un package universel est privilégié.</td></tr>
            <tr><td><code>channel</code></td><td>Non</td><td><code>stable</code>, <code>beta</code> ou <code>nightly</code>. Défaut : <code>stable</code></td></tr>
          </tbody>
        </table></div>
        <p className="docs-note">Si aucune plateforme n’est détectée et aucun paramètre n’est fourni, l’utilisateur est redirigé vers la page web de l’application.</p>
      </section>

      <section id="packages">
        <h2>Liste des packages</h2>
        <p>L’endpoint <code>/packages</code> retourne tous les binaires disponibles pour une application, triés par version décroissante.</p>
        <pre><code>{packagesRequest}</code></pre>
        <pre><code>{packagesResponse}</code></pre>
      </section>

      <section id="parametres">
        <h2>Paramètres de vérification</h2>
        <div className="docs-table-wrap"><table className="docs-table">
          <thead><tr><th>Paramètre</th><th>Obligatoire</th><th>Valeurs</th></tr></thead>
          <tbody>
            <tr><td><code>current_version</code></td><td>Oui</td><td>Version installée, par exemple <code>1.4.0</code></td></tr>
            <tr><td><code>platform</code></td><td>Oui</td><td><code>windows</code>, <code>macos</code>, <code>linux</code> ou <code>android</code></td></tr>
            <tr><td><code>arch</code></td><td>Non</td><td><code>x64</code>, <code>arm64</code> ou <code>universal</code>. Défaut : <code>universal</code></td></tr>
            <tr><td><code>channel</code></td><td>Non</td><td><code>stable</code>, <code>beta</code> ou <code>nightly</code>. Défaut : <code>stable</code></td></tr>
          </tbody>
        </table></div>
      </section>

      <section id="reponses">
        <h2>Comprendre la réponse</h2>
        <h3>Mise à jour disponible</h3>
        <p><code>available</code> vaut <code>true</code>. Le bloc <code>artifact</code> fournit le fichier, sa taille, son empreinte et son URL de téléchargement.</p>
        <pre><code>{availableResponse}</code></pre>
        <h3>Application déjà à jour</h3>
        <p>L’absence de mise à jour est une réponse normale avec le statut HTTP <code>200</code>.</p>
        <pre><code>{unavailableResponse}</code></pre>
      </section>

      <section id="integration">
        <h2>Exemple TypeScript</h2>
        <p>Vérifiez d’abord le statut HTTP, puis lisez <code>data.available</code> avant de proposer le téléchargement.</p>
        <pre><code>{typescriptExample}</code></pre>
        <h3>Téléchargement et intégrité</h3>
        <p>L’URL retournée accepte l’en-tête HTTP <code>Range</code> pour reprendre un téléchargement interrompu. Après réception, calculez l’empreinte SHA-256 du fichier et comparez-la à <code>artifact.sha256</code> avant toute installation.</p>
      </section>

      <section id="endpoints">
        <h2>Endpoints publics</h2>
        <div className="endpoint-list">
          <div><span className="http-method">GET</span><code>/api/v1/apps/{`{slug}`}/updates</code><p>Recherche la dernière version compatible.</p></div>
          <div><span className="http-method">GET</span><code>/api/v1/apps/{`{slug}`}/download</code><p>Redirige vers le binaire adapté à la plateforme. Détecte l’OS depuis le User-Agent si aucun paramètre n’est fourni.</p></div>
          <div><span className="http-method">GET</span><code>/api/v1/apps/{`{slug}`}/packages</code><p>Liste tous les packages disponibles pour une application.</p></div>
          <div><span className="http-method">GET</span><code>/api/v1/apps/{`{slug}`}</code><p>Retourne la fiche d’une application et ses versions publiées.</p></div>
          <div><span className="http-method">GET</span><code>/api/v1/downloads/{`{releaseId}`}</code><p>Télécharge le fichier associé à une version.</p></div>
          <div><span className="http-method">GET</span><code>/api/v1/meta</code><p>Décrit la version de l’API et les plateformes reconnues.</p></div>
        </div>
      </section>

      <section id="erreurs">
        <h2>Erreurs</h2>
        <p>Les clients doivent interpréter <code>error.code</code>, car le texte du message peut évoluer.</p>
        <div className="docs-table-wrap"><table className="docs-table">
          <thead><tr><th>Statut</th><th>Code</th><th>Signification</th></tr></thead>
          <tbody>
            <tr><td><code>400</code></td><td><code>invalid_parameters</code></td><td>Un paramètre est absent ou invalide.</td></tr>
            <tr><td><code>404</code></td><td><code>not_found</code></td><td>Le slug ne correspond à aucune application publiée.</td></tr>
            <tr><td><code>429</code></td><td><code>rate_limited</code></td><td>Trop de vérifications ont été envoyées. Réessayez plus tard.</td></tr>
          </tbody>
        </table></div>
        <pre><code>{`{
  "error": {
    "code": "invalid_parameters",
    "message": "Paramètres de mise à jour invalides."
  }
}`}</code></pre>
      </section>
    </article>
  </div></main>;
}
