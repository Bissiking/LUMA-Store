# LUMA Store

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js avec TypeScript, choisi par l'utilisateur. PostgreSQL conserve les métadonnées et les comptes liés à Kyros. Les binaires sont stockés sur le disque local derrière une abstraction de stockage afin de ne pas coupler le domaine à l'implémentation.

## Users

- Les utilisateurs de l'écosystème LUMA consultent le catalogue et téléchargent ou mettent à jour leurs applications sur Windows, macOS et Linux.
- Les applications clientes interrogent des endpoints stables pour détecter et récupérer leurs mises à jour.
- Les administrateurs Kyros publient, modifient, protègent et retirent des applications et leurs versions.

## Product Purpose

LUMA Store centralise la distribution des applications de l'écosystème LUMA : APK, EXE, MSI, DMG, paquets et scripts Linux, ainsi que d'autres formats publiés ultérieurement. Le produit fournit un catalogue humain et un contrat de mise à jour exploitable par les applications.

## Positioning

Une même fiche applicative porte toutes ses variantes de plateforme, son historique de versions et son contrat de mise à jour automatisée, au lieu de disperser les binaires entre pages de téléchargement et dépôts indépendants.

## Operating Context

Le catalogue et les téléchargements sont publics. L'administration passe par le SSO Kyros. Les applications peuvent vérifier leur dernière version compatible puis télécharger l'artefact correspondant. Les agents Linux doivent pouvoir installer le dépôt et recevoir leurs mises à jour par les outils natifs de la distribution.

## Capabilities and Constraints

- Formats initiaux : APK, EXE, MSI, DMG et artefacts Linux ; la liste reste extensible.
- Stockage initial sur disque local.
- Chaque application conserve au minimum cinq versions, valeur configurable par variable d'environnement.
- Une version peut être protégée afin d'empêcher sa suppression automatique ou manuelle.
- L'administration V1 est accordée uniquement lorsque Kyros identifie l'utilisateur comme administrateur global.
- Le modèle d'autorisations métier plus fin est explicitement reporté après la V1.
- Les endpoints de catalogue, de vérification de mise à jour et de téléchargement sont publics.
- Les secrets Kyros restent exclusivement côté serveur.

## Brand Commitments

Le produit s'appelle « LUMA Store » et appartient à l'écosystème LUMA. Une identité et un logo propres doivent être créés et le logo doit être décliné en favicon.

## Evidence on Hand

Le dépôt ne contient initialement qu'un README. Aucun témoignage, volume de téléchargement, catalogue réel, prix ou engagement de disponibilité n'est fourni ; l'interface ne doit pas en fabriquer.

## Product Principles

- Un binaire publié doit être vérifiable, traçable et servi sans ambiguïté.
- La compatibilité machine doit être explicite avant le téléchargement.
- L'administration doit rendre les actions risquées rares, intentionnelles et auditables.
- Les clients automatisés doivent disposer d'un contrat stable, versionné et sobre.
- Une mauvaise configuration de sécurité doit échouer en fermeture, jamais ouvrir l'administration.

## Accessibility & Inclusion

L'interface web vise WCAG 2.2 AA, reste utilisable au clavier, respecte la préférence de réduction des animations et ne dépend jamais uniquement de la couleur pour transmettre un état.
