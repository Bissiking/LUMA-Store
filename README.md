# LUMA Store

LUMA Store distribue les applications de l’écosystème LUMA sur Windows, macOS, Linux et Android. Il comprend un catalogue public, une API de mise à jour V1, des téléchargements reprenables, un installateur Linux et une administration protégée par Kyros.

## Démarrage local

Prérequis : Node.js 20.9+ et Docker.

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Le catalogue est accessible sur `http://localhost:3000`. Sans PostgreSQL, la page d’accueil affiche uniquement un aperçu local clairement identifié ; les API et l’administration restent fermées.

## Configuration Kyros

Créez dans Kyros une application en mode `sso` :

- callback : `https://store.example.fr/auth/callback` ;
- scopes : `profile email` ;
- audience : `kyros:sso:luma-store` ;
- version SSO : `v3` ;
- édition et périmètre applicatif : `standard` ;
- URL d’accueil : `https://store.example.fr`.

Copiez ensuite les variables `KYROS_*` dans `.env`, notamment `KYROS_SSO_VERSION=v3`, `KYROS_EDITION=standard` et `KYROS_APPLICATION_SCOPE=standard`. LUMA Store transmet ces métadonnées de protocole à `/authorize`, `/token` et `/revoke`. Il vérifie la signature HS256, `iss`, `aud`, `resource_aud`, `exp` et refuse l’administration si le claim `role` n’est pas exactement `admin`. Le secret client et le secret JWT ne sont jamais envoyés au navigateur.

En production, configurez obligatoirement deux secrets distincts de 32 caractères minimum :

```bash
openssl rand -base64 48 # SESSION_SECRET
openssl rand -base64 48 # SESSION_ENCRYPTION_KEY
```

## Stockage et rétention

Les fichiers sont placés sous `STORAGE_DIR` avec un chemin généré à partir d’UUID validés. Le nom envoyé par le navigateur n’est jamais utilisé comme chemin. Le téléversement est écrit en flux dans un fichier temporaire, limité par `MAX_ARTIFACT_SIZE_BYTES`, puis déplacé atomiquement après calcul de SHA-256.

`MIN_VERSIONS_TO_KEEP` vaut au minimum 5. Une suppression est refusée lorsque ce plancher serait franchi. Une version marquée `is_protected` ne peut pas être retirée, même au-dessus du plancher, avant retrait explicite de sa protection.

Pour un déploiement multi-instance, montez `STORAGE_DIR` sur un volume partagé ou implémentez un adaptateur objet ; le modèle métier ne dépend pas d’une URL fournie par l’utilisateur.

## API publique

- `GET /api/v1/meta`
- `GET /api/v1/apps`
- `GET /api/v1/apps/:slug`
- `GET /api/v1/apps/:slug/updates?current_version=1.0.0&platform=windows&arch=x64&channel=stable`
- `GET /api/v1/downloads/:releaseId` (supporte `Range`)
- `GET /install/linux`

La documentation lisible se trouve sur `/docs/api`.

## Sécurité

Le socle inclut :

- validation Zod et requêtes SQL paramétrées ;
- contrôle `Origin` sur toutes les mutations admin ;
- cookies `HttpOnly`, `SameSite=Lax`, `Secure` en production ;
- état SSO signé, expirant et consommé une fois ;
- session opaque stockée sous forme hachée ;
- refresh token chiffré en AES-256-GCM au repos ;
- contrôle strict des extensions, limites de taille et stockage anti-traversée ;
- limites de débit sur connexion, catalogue, mises à jour et téléchargements ;
- CSP, HSTS en production, anti-framing, `nosniff`, politique de permissions et `noindex` admin ;
- journal d’audit des publications et actions sensibles ;
- échec fermé si Kyros ou PostgreSQL est indisponible.

Les limites de débit sont en mémoire dans cette V1. Derrière plusieurs instances, utilisez Redis ou le rate limiting du reverse proxy. Configurez également la limite de corps du proxy au-dessus de `MAX_ARTIFACT_SIZE_BYTES` et désactivez sa mise en tampon pour la route d’upload.

## Commandes

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
