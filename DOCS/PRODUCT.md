<!-- PRODUCT.md -->
# LUMA Store

## Platform

web

## Stack

Next.js avec TypeScript. PostgreSQL conserve les métadonnées, les applications, les releases, les médias et les comptes liés à Kyros. Les binaires et médias sont stockés derrière une abstraction de stockage afin de ne pas coupler le domaine métier à une implémentation unique.

## Users

- Les utilisateurs de l’écosystème LUMA consultent le catalogue et téléchargent les applications compatibles avec Windows, macOS, Linux et Android.
- Les applications clientes utilisent des endpoints stables pour détecter et récupérer leurs mises à jour.
- Les administrateurs Kyros créent et maintiennent les applications, publient les versions, corrigent les métadonnées, gèrent les médias et contrôlent la visibilité.

## Product Purpose

LUMA Store centralise la distribution des applications de l’écosystème LUMA.

Le produit doit gérer :

- le catalogue public ;
- les fiches applicatives ;
- les binaires ;
- les versions ;
- les architectures ;
- les plateformes ;
- les médias ;
- les mises à jour automatisées ;
- la gestion administrative.

Une même fiche applicative regroupe toutes ses variantes et toutes ses versions.

## Product Positioning

LUMA Store n’est pas une landing page promotionnelle.

C’est un point de distribution officiel qui doit se comporter comme un store logiciel moderne : catalogue clair, compatibilité visible, téléchargement explicite, captures d’écran, historique de versions et administration robuste.

## Operating Context

Le catalogue et les téléchargements sont publics.

L’administration est protégée par Kyros.

Les applications clientes peuvent demander :

- la dernière version disponible ;
- les packages compatibles ;
- les métadonnées d’une release ;
- le téléchargement d’un artefact.

Les agents Linux doivent pouvoir utiliser des packages natifs lorsque cela est pertinent.

## Core Product Principles

- Une application est l’unité principale du Store.
- Une release appartient toujours à une application.
- Une publication doit rester modifiable lorsque seules les métadonnées sont erronées.
- Le fichier d’origine et les valeurs détectées doivent rester traçables.
- L’auto-détection doit accélérer la publication sans retirer le contrôle manuel.
- Les anciennes versions doivent rester accessibles sans encombrer l’expérience publique.
- Les médias doivent être hébergés ou gérés par le Store, pas dépendre d’URLs externes.
- Toute action destructive doit être explicite et auditée.

---

# Application Model

Une application possède au minimum :

- id ;
- slug ;
- name ;
- summary ;
- description ;
- publisher ;
- category ;
- status ;
- featured ;
- platforms ;
- icon ;
- screenshots ;
- releases ;
- createdAt ;
- updatedAt.

## Status

Statuts possibles :

- draft ;
- published ;
- hidden ;
- retired.

---

# Media Model

## Application Icon

L’icône doit être importée dans LUMA Store.

Les URLs d’images externes ne sont plus la source canonique de l’icône.

Champs recommandés :

- storageKey ;
- mimeType ;
- width ;
- height ;
- sizeBytes ;
- sha256.

## Screenshots

Une application peut posséder plusieurs captures d’écran.

Champs recommandés :

- id ;
- applicationId ;
- storageKey ;
- mimeType ;
- width ;
- height ;
- sizeBytes ;
- sha256 ;
- sortOrder ;
- caption ;
- platform ;
- createdAt.

Les captures sont ordonnables.

---

# Release Model

Une release représente un package distribuable.

Champs recommandés :

- id ;
- applicationId ;
- version ;
- platform ;
- architecture ;
- packageType ;
- channel ;
- distribution ;
- originalFileName ;
- detectedVersionRaw ;
- detectedArchitectureRaw ;
- detectedPackageRaw ;
- detectedDistributionRaw ;
- sizeBytes ;
- sha256 ;
- storageKey ;
- isProtected ;
- isPublic ;
- createdAt ;
- updatedAt.

## Architecture Normalization

Valeurs canoniques recommandées :

- x64 ;
- arm64 ;
- x86 ;
- universal ;
- other.

Exemples de normalisation :

```text
amd64   -> x64
x86_64  -> x64
aarch64 -> arm64
arm64   -> arm64
i386    -> x86
x86     -> x86
```

La valeur brute détectée doit être conservée.

## Package Types

Liste initiale extensible :

- deb ;
- rpm ;
- exe ;
- msi ;
- dmg ;
- apk ;
- appimage ;
- tar.gz ;
- other.

---

# Release Detection

Le Store doit analyser le nom du fichier importé.

Exemples :

```text
argos-prob-1.5.0-1.fc44.aarch64.rpm
argos-prob_1.5.1_amd64.deb
argos-prob_1.5.1_arm64.deb
```

Le détecteur doit tenter d’identifier :

- version ;
- package ;
- architecture ;
- distribution ;
- plateforme.

Le résultat n’est jamais considéré comme irréfutable.

L’administrateur doit pouvoir corriger les valeurs avant ou après publication.

---

# Release Editing

Les métadonnées d’une release doivent être modifiables après publication.

Exemples :

- corriger arm64 vers x64 ;
- corriger la plateforme ;
- corriger le type de package ;
- corriger la distribution ;
- corriger le canal ;
- corriger la version.

Une correction de métadonnées ne remplace pas automatiquement le fichier binaire.

Un changement de fichier doit être traité comme une opération distincte.

---

# Current Version and History

Le Store public doit afficher la version courante en priorité.

Les versions historiques sont masquées par défaut derrière une interaction dépliable.

Une même version peut contenir plusieurs variantes :

```text
1.5.1

Windows
- x64 MSI
- x64 EXE

Linux
- x64 DEB
- arm64 DEB
- arm64 RPM
```

Le système doit éviter les répétitions inutiles dans l’interface.

---

# Release Visibility

Une release peut être :

- publique ;
- masquée ;
- protégée ;
- retirée.

`isProtected` empêche une suppression accidentelle.

`isPublic` contrôle l’exposition au catalogue public.

---

# Administration

## Dashboard

Le dashboard doit fournir une vue synthétique :

- applications ;
- versions ;
- plateformes ;
- dernières publications ;
- état du stockage ;
- activité récente ;
- anomalies.

## Applications

L’administration est organisée par application.

Chaque application expose :

```text
Aperçu
Versions
Médias
Paramètres
```

La publication d’une version n’est pas une destination principale globale.

---

# Public Catalog

Le catalogue public doit :

- mettre la recherche en avant ;
- afficher les plateformes ;
- permettre le filtrage ;
- afficher les applications mises en avant ;
- rendre les applications rapidement accessibles ;
- limiter la place du contenu purement promotionnel.

---

# Application Public Page

La fiche publique affiche :

- icône ;
- nom ;
- éditeur ;
- résumé ;
- téléchargement principal ;
- captures d’écran ;
- description ;
- informations ;
- version actuelle ;
- historique dépliable.

---

# Storage

Les binaires et médias sont stockés via une abstraction commune.

Le nom fourni par le navigateur ne doit jamais devenir directement un chemin disque.

Les opérations d’upload doivent :

- écrire en flux ;
- vérifier les limites ;
- calculer SHA-256 ;
- valider le type ;
- déplacer atomiquement le fichier après validation.

---

# Retention

Chaque application conserve au minimum un nombre configurable de versions.

Les versions protégées ne sont jamais supprimées automatiquement.

La rétention doit fonctionner par application et ne pas supprimer la version courante.

---

# Security

- Administration protégée par Kyros.
- Secrets uniquement côté serveur.
- Validation stricte des entrées.
- Contrôle d’origine sur les mutations.
- Cookies sécurisés.
- Upload limité en taille.
- Contrôle des extensions et types MIME.
- Protection contre la traversée de chemin.
- Audit des actions sensibles.
- Administration fermée si l’authentification ou les dépendances critiques sont indisponibles.

---

# Accessibility

LUMA Store vise WCAG 2.2 AA.

- utilisable au clavier ;
- focus visible ;
- réduction des animations respectée ;
- aucun état communiqué uniquement par couleur ;
- cibles tactiles suffisantes.

---

# Brand Commitments

Conserver l’identité visuelle existante :

- LUMA Iris ;
- surfaces minérales ;
- encre aubergine ;
- Sora pour la structure ;
- Manrope pour l’usage ;
- interface sobre, officielle et non publicitaire.

Le redesign doit principalement améliorer la structure et l’usage, pas remplacer l’identité.

---

# Migration / Compatibility

La refonte doit préserver autant que possible :

- les endpoints publics existants ;
- les téléchargements ;
- les routes de mise à jour ;
- les données déjà publiées ;
- la compatibilité des clients.

Toute évolution de contrat API doit être versionnée.

---

# Product Override Note

Ce document peut remplacer le `PRODUCT.md` actuel si la refonte est validée.

Si Impeccable doit régénérer ou synchroniser le contrat produit, il doit considérer ce document comme la nouvelle intention produit de référence et préserver les exigences fonctionnelles ci-dessus.
