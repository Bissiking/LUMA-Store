<!-- UX.md -->
# LUMA Store — UX

## Objectif

Faire évoluer LUMA Store d’une V1 fonctionnelle orientée CRUD vers un véritable outil de distribution logicielle, avec une expérience publique proche des stores natifs et une administration structurée autour des applications.

La refonte doit conserver l’identité visuelle actuelle et améliorer surtout la logique d’usage, la hiérarchie des informations et la gestion des versions.

---

## Principes UX

- Une version appartient toujours à une application.
- L’administration doit raisonner par application, pas par action technique isolée.
- Les informations importantes doivent être visibles immédiatement.
- Les anciennes versions ne doivent pas saturer l’interface.
- L’auto-détection aide l’utilisateur mais ne remplace jamais la correction manuelle.
- Les médias sont gérés par le Store lui-même, jamais dépendants d’une URL externe.
- Les opérations risquées doivent être explicites et auditables.
- Le Store public doit privilégier le catalogue plutôt qu’un hero trop dominant.

---

# Navigation publique

## Header

- Logo LUMA Store
- Recherche globale
- Applications
- Administration

## Pages publiques

```text
/
├── Catalogue
├── Recherche
├── Fiche application
├── Documentation API
└── État du service
```

---

# Accueil public

## Intention

Réduire légèrement la place du hero afin que le catalogue soit visible plus tôt.

La page doit répondre rapidement à la question :

> Quelle application veux-tu installer ?

## Structure recommandée

```text
Header

Hero compact
├── identité LUMA Store
├── message court
├── rechercher / explorer
└── plateformes disponibles

Catalogue
├── filtres plateforme
├── filtres catégorie
├── applications mises en avant
└── toutes les applications

Garanties
├── intégrité
├── téléchargement direct
└── source officielle

Footer
```

---

# Fiche publique d’une application

## En-tête

```text
[ Icône ]

Nom de l’application
Publié par LUMA
Résumé

[ Télécharger ]
```

Afficher également :

- catégorie ;
- plateformes ;
- dernière version stable ;
- statut de publication.

## Captures d’écran

Afficher une galerie horizontale inspirée des stores Microsoft, Apple et Google.

Fonctions :

- plusieurs captures ;
- ordre personnalisable ;
- légende facultative ;
- plateforme facultative ;
- ouverture en grand.

## À propos

Description complète de l’application.

## Informations

- éditeur ;
- catégorie ;
- plateformes ;
- intégrité ;
- dernière version ;
- canal courant.

---

# Versions publiques

## Règle principale

La version courante est toujours visible.

Les anciennes versions sont masquées par défaut derrière un système dépliable.

Exemple :

```text
Versions disponibles

Version actuelle
1.5.1
Linux · x64 · DEB
Publié le 04/10/2026

[ Télécharger ]   [ Voir toutes les versions ▾ ]
```

Une fois déplié :

```text
Versions précédentes

1.5.0
Linux · x64 · DEB

1.4.3
Linux · arm64 · DEB

1.4.2
Fedora 44 · arm64 · RPM
```

## Regroupement par version

Lorsqu’une même version existe pour plusieurs plateformes ou architectures, ne pas répéter la version en plusieurs lignes indépendantes.

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

## Visibilité

Une release peut être :

- publique ;
- masquée du catalogue public ;
- protégée ;
- retirée.

Une release masquée reste visible dans l’administration.

---

# Administration

## Sidebar principale

```text
Administration
├── Vue d’ensemble
├── Applications
├── Médias / Assets
├── Paramètres
└── Déconnexion
```

Supprimer « Publier une version » de la navigation principale.

La publication d’une version doit toujours partir du contexte d’une application.

---

# Dashboard

Le dashboard ne doit pas répéter simplement la liste des applications.

## Informations utiles

- nombre d’applications ;
- nombre de versions ;
- applications publiées ;
- applications en brouillon ;
- plateformes actives ;
- état du stockage ;
- dernières publications ;
- dernières modifications ;
- anomalies éventuelles.

Exemple :

```text
12 Applications      38 Versions      4 Plateformes
11 publiées           34 stables       Service opérationnel

Activité récente
────────────────────────────
Nino       1.8.0 publiée       il y a 2h
Argos      3.0.0 ajoutée       hier
Drivio     fiche modifiée      hier
```

---

# Gestion des applications

## Liste

Afficher :

- icône ;
- nom ;
- slug ;
- catégorie ;
- dernière version ;
- plateformes ;
- statut.

Actions principales :

- ouvrir ;
- créer une application.

## Détail d’une application

Navigation contextuelle :

```text
Application > Argos

[ Aperçu ] [ Versions ] [ Médias ] [ Paramètres ]
```

---

# Onglet Aperçu

Afficher et permettre de modifier :

- nom ;
- slug ;
- résumé ;
- description ;
- catégorie ;
- éditeur ;
- statut ;
- plateformes ;
- mise en avant ;
- aperçu public.

Prévoir un bouton :

- Voir sur le Store.

---

# Onglet Versions

## Vue générale

Afficher en priorité la version courante.

Les anciennes versions peuvent être repliées.

Dans l’administration, les groupes doivent pouvoir être développés individuellement.

## Actions

- publier une version ;
- modifier une release existante ;
- masquer / afficher ;
- protéger / déprotéger ;
- retirer ;
- télécharger ;
- consulter les métadonnées.

## Correction après publication

Une release doit pouvoir être corrigée après publication lorsqu’une métadonnée est erronée.

Exemples :

- arm64 → x64 ;
- plateforme incorrecte ;
- package incorrect ;
- canal incorrect ;
- version incorrecte ;
- distribution incorrecte.

Le fichier binaire original ne doit pas être modifié par une simple correction de métadonnées.

---

# Publication d’une version

Utiliser un flow guidé.

## Étape 1 — Application

L’application est déjà connue lorsqu’on vient depuis sa fiche.

## Étape 2 — Fichier

Upload du binaire.

Exemples :

```text
argos-prob-1.5.0-1.fc44.aarch64.rpm
argos-prob_1.5.1_amd64.deb
argos-prob_1.5.1_arm64.deb
```

## Étape 3 — Auto-détection

Le Store tente de détecter :

- nom ;
- version ;
- plateforme ;
- architecture ;
- type de package ;
- distribution ;
- canal lorsque possible.

## Étape 4 — Validation manuelle

Tous les champs détectés restent modifiables avant publication.

L’interface doit clairement distinguer :

- détecté automatiquement ;
- valeur finale utilisée.

## Étape 5 — Publication

Afficher un résumé complet avant validation.

---

# Auto-détection

## Valeur brute et valeur normalisée

Conserver séparément :

```text
detectedArchitectureRaw
architecture
```

Exemples de normalisation :

```text
amd64   -> x64
x86_64  -> x64
aarch64 -> arm64
arm64   -> arm64
i386    -> x86
x86     -> x86
```

Même principe pour :

- package ;
- distribution ;
- plateforme.

## Détection de package

Formats prévus :

- deb ;
- rpm ;
- exe ;
- msi ;
- dmg ;
- apk ;
- appimage ;
- tar.gz ;
- autres formats extensibles.

---

# Onglet Médias

## Icône

Ne plus utiliser d’URL externe.

Fonctions :

- upload direct ;
- aperçu ;
- remplacement ;
- suppression ;
- validation du format ;
- recommandation d’image carrée.

Formats recommandés :

- PNG ;
- WEBP.

## Captures d’écran

Fonctions :

- upload multiple ;
- drag & drop ;
- réorganisation ;
- suppression ;
- légende facultative ;
- plateforme facultative ;
- aperçu plein écran.

---

# Onglet Paramètres

## Application

- visibilité ;
- mise en avant ;
- catégorie ;
- politique de publication ;
- politique de conservation ;
- paramètres de compatibilité.

## Zone dangereuse

- retrait de l’application ;
- suppression définitive si autorisée ;
- confirmation explicite.

---

# Paramètres globaux du Store

Prévoir une page distincte de l’administration applicative.

Sections :

```text
Paramètres
├── Général
├── Distribution
├── Stockage
├── Mises à jour
└── Sécurité / Kyros
```

Ne pas mélanger paramètres du Store et paramètres d’une application.

---

# Responsive

Conserver l’approche actuelle :

- desktop : sidebar admin ;
- tablette : sidebar compacte ou navigation adaptée ;
- mobile : navigation contextuelle simplifiée ;
- cartes et captures d’écran défilables horizontalement.

Les actions essentielles doivent rester accessibles avec une cible tactile minimale de 44px.

---

# Accessibilité

- WCAG 2.2 AA ;
- navigation clavier complète ;
- focus visible ;
- état jamais communiqué uniquement par couleur ;
- respect de `prefers-reduced-motion` ;
- labels explicites pour les actions destructives.

---

# Résultat attendu

LUMA Store doit donner l’impression d’un véritable store logiciel officiel :

- simple côté utilisateur ;
- riche côté administration ;
- intelligent sur la détection ;
- corrigeable sans bricolage ;
- centré sur les applications ;
- clair même avec beaucoup de versions et de packages.
