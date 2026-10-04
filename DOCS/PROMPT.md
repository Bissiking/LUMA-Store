<!-- PROMPT.md -->
# LUMA Store — Prompt de refonte

Tu travailles sur le dépôt `Bissiking/LUMA-Store`.

L’objectif est de refondre l’UX et l’administration sans transformer inutilement l’identité visuelle existante.

Avant toute modification importante :

1. lire `PRODUCT.md` ;
2. lire `DESIGN.md` ;
3. lire `UX.md` ;
4. inspecter le code existant ;
5. préserver les fonctionnalités déjà opérationnelles sauf contradiction explicite avec ces documents.

---

# Objectif principal

Transformer LUMA Store d’une V1 CRUD fonctionnelle en véritable store logiciel officiel.

Le résultat doit être :

- plus clair ;
- plus cohérent ;
- centré sur les applications ;
- plus efficace pour publier des releases ;
- plus riche côté médias ;
- compatible avec l’API existante autant que possible.

Ne pas refaire toute l’application simplement pour changer son apparence.

---

# Identité à conserver

Conserver l’identité actuelle décrite dans `DESIGN.md` :

- palette LUMA ;
- fond minéral ;
- iris ;
- encre aubergine ;
- Sora ;
- Manrope ;
- style officiel et sobre.

Améliorer surtout :

- hiérarchie ;
- navigation ;
- densité ;
- structure ;
- responsive ;
- administration.

---

# Refonte publique

## Accueil

Réduire légèrement le hero actuel afin que le catalogue soit visible plus tôt.

Conserver :

- identité LUMA Store ;
- recherche ;
- filtres ;
- plateformes ;
- applications à la une.

Le Store doit être perçu comme un catalogue avant d’être perçu comme une landing page.

---

# Fiche application publique

Créer ou améliorer une fiche complète contenant :

- icône ;
- nom ;
- éditeur ;
- résumé ;
- bouton de téléchargement principal ;
- galerie de captures d’écran ;
- description ;
- informations ;
- version courante ;
- historique des versions.

## Versions

La version courante est visible par défaut.

Les anciennes versions sont masquées derrière un accordéon ou un composant dépliable.

Regrouper les packages par numéro de version.

Exemple :

```text
1.5.1 — version actuelle

Windows
  x64 · MSI
  x64 · EXE

Linux
  x64 · DEB
  arm64 · DEB
  arm64 · RPM
```

Ne pas afficher une longue liste répétitive.

---

# Refonte administration

## Sidebar

Remplacer l’organisation actuelle par :

```text
Vue d’ensemble
Applications
Médias / Assets
Paramètres
Déconnexion
```

Supprimer « Publier une version » de la navigation principale.

Une version se publie depuis une application.

---

# Dashboard

Ne pas dupliquer la page Applications.

Afficher :

- nombre d’applications ;
- nombre de releases ;
- nombre d’applications publiées ;
- plateformes actives ;
- activité récente ;
- dernières releases ;
- état du stockage ;
- avertissements utiles.

---

# Applications

La page Applications liste :

- icône ;
- nom ;
- slug ;
- catégorie ;
- dernière version ;
- plateformes ;
- statut.

Chaque application possède une navigation contextuelle :

```text
Aperçu
Versions
Médias
Paramètres
```

---

# Aperçu application

Permettre la modification de :

- nom ;
- slug ;
- résumé ;
- description ;
- catégorie ;
- éditeur ;
- plateformes ;
- statut ;
- featured.

Ajouter une action permettant de voir la fiche publique.

---

# Versions

Créer une interface de gestion claire.

Afficher la version actuelle en premier.

Replier l’historique par défaut.

Permettre :

- publier ;
- modifier ;
- masquer ;
- afficher ;
- protéger ;
- déprotéger ;
- retirer ;
- consulter les métadonnées.

Une release existante doit pouvoir être corrigée après publication.

Exemple :

```text
arm64 -> x64
```

Une modification de métadonnées ne doit pas modifier le fichier binaire.

---

# Publication d’une release

Créer un flow guidé.

## Flow

```text
Application
→ Upload fichier
→ Auto-détection
→ Vérification / correction
→ Résumé
→ Publication
```

Si l’utilisateur lance l’action depuis la fiche d’une application, ne pas lui redemander l’application.

---

# Auto-détection

Analyser les noms de fichiers.

Exemples :

```text
argos-prob-1.5.0-1.fc44.aarch64.rpm
argos-prob_1.5.1_amd64.deb
argos-prob_1.5.1_arm64.deb
```

Détecter lorsque possible :

- version ;
- architecture ;
- package ;
- plateforme ;
- distribution.

Ne jamais considérer l’auto-détection comme définitive.

Tous les champs doivent rester modifiables.

---

# Normalisation architecture

Utiliser des valeurs canoniques.

```text
amd64   -> x64
x86_64  -> x64
aarch64 -> arm64
arm64   -> arm64
i386    -> x86
x86     -> x86
```

Conserver la valeur brute détectée séparément.

Exemple :

```text
detectedArchitectureRaw = "aarch64"
architecture = "arm64"
```

---

# Médias

## Icône

Supprimer la dépendance à une URL externe comme source principale de l’icône.

Ajouter :

- upload ;
- aperçu ;
- remplacement ;
- suppression ;
- validation.

Formats recommandés :

- PNG ;
- WEBP.

Préférer une image carrée.

## Captures d’écran

Ajouter une galerie administrable :

- upload multiple ;
- drag & drop ;
- ordre ;
- suppression ;
- légende facultative ;
- plateforme facultative.

Afficher les captures sur la fiche publique comme sur un store natif.

---

# Données

Adapter le modèle de données si nécessaire.

Prévoir au minimum pour les releases :

```text
originalFileName
detectedVersionRaw
detectedArchitectureRaw
detectedPackageRaw
detectedDistributionRaw
version
platform
architecture
packageType
distribution
channel
isProtected
isPublic
```

Prévoir une structure persistante pour :

- icône ;
- screenshots ;
- ordre des screenshots.

Créer les migrations nécessaires.

Ne jamais perdre silencieusement les données existantes.

---

# Compatibilité

Préserver autant que possible les routes existantes :

```text
GET /api/v1/meta
GET /api/v1/apps
GET /api/v1/apps/:slug
GET /api/v1/apps/:slug/download
GET /api/v1/apps/:slug/packages
GET /api/v1/apps/:slug/updates
GET /api/v1/downloads/:releaseId
GET /install/linux
```

Toute rupture nécessaire doit être expliquée et versionnée.

---

# Sécurité

Conserver les protections existantes :

- Kyros ;
- validation Zod ;
- requêtes paramétrées ;
- contrôle Origin ;
- cookies sécurisés ;
- CSP ;
- stockage anti-traversée ;
- limites de taille ;
- SHA-256 ;
- audit ;
- fail closed.

Les nouveaux uploads médias doivent utiliser les mêmes principes de sécurité que les artefacts.

---

# Contraintes UX

- responsive ;
- clavier ;
- WCAG 2.2 AA ;
- `prefers-reduced-motion` ;
- états explicites ;
- actions destructives confirmées ;
- pas de couleur seule pour communiquer un statut.

---

# Méthode de travail

Faire les changements progressivement.

Ordre recommandé :

1. modèle de données ;
2. helpers d’auto-détection ;
3. stockage médias ;
4. refonte admin ;
5. gestion releases ;
6. galerie médias ;
7. fiche publique ;
8. responsive ;
9. tests ;
10. build final.

Après chaque étape importante :

- typecheck ;
- lint ;
- tests concernés.

À la fin :

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

---

# Important

Ne pas inventer des métriques, téléchargements ou preuves sociales.

Ne pas supprimer une fonction existante uniquement parce qu’elle semble inutile sans vérifier son usage.

Ne pas modifier les contrats publics silencieusement.

Ne pas déplacer la logique de sécurité côté client.

Ne pas remplacer la charte graphique actuelle par une nouvelle direction visuelle non demandée.

Le but est une refonte UX et fonctionnelle maîtrisée, pas une réécriture gratuite.
