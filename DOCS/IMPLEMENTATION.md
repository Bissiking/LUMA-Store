# Store 1.0.0 — application de PROMPT.md

La refonte conserve la palette, les polices, les routes publiques V1 et les protections Kyros existantes.

## Catalogue public

- Hero compact et catalogue visible plus tôt.
- Fiche complète : éditeur, résumé, description, informations, version et canal courants.
- Galerie de captures hébergées, défilement horizontal et agrandissement dans un dialogue natif.
- Packages regroupés par version et plateforme ; historique replié par défaut.
- Téléchargement principal respectant la plateforme choisie manuellement.
- Version du Store dans le footer, issue de `package.json`.

## Administration

- Navigation : Vue d’ensemble, Applications, Médias / Assets, Paramètres, Déconnexion.
- Dashboard distinct : compteurs réels, dernières releases, audit récent et stockage.
- Fiches avec onglets Aperçu, Versions, Médias et Paramètres.
- Plateformes, visibilité et mise en avant modifiables ; retrait confirmé.
- Publication depuis une application, auto-détection modifiable et résumé avant confirmation.
- Correction des releases sans modification du binaire ou de son SHA-256.
- Visibilité publique, protection et retrait ; conservation de la version courante et d’un minimum de versions distinctes par application.
- Upload PNG/WEBP, remplacement/suppression d’icône, captures multiples, ordre par glisser-déposer ou boutons, légendes et plateformes.
- Paramètres globaux consultables ; configuration globale via l’environnement serveur.

## Données et compatibilité

`db/migrations/001-store-ux.sql` ajoute les valeurs brutes détectées, le nom original,
la distribution, la visibilité et les médias persistants. Le script de migration
applique chaque migration une fois, dans une transaction. Les URLs d’icônes
historiques restent conservées ; après remplacement par une icône hébergée,
elles ne redeviennent pas la source affichée en cas de suppression.

Les routes V1 conservent leurs champs existants. Les architectures `x86` et
`other` sont acceptées en complément. Les releases masquées sont exclues du
catalogue, des API et des téléchargements publics, avec accès administrateur.
`/install/linux` distribue un script d’installation DEB/RPM vérifiant le SHA-256.

## Vérifications et mise en service

- TypeScript et compilation de production validés.
- 41 tests unitaires et d’intégration, dont une migration avec des données existantes.
- 7 parcours Playwright : responsive public, galerie/clavier, accès fermé sans session,
  correction sans changement de fichier, édition de fiche, publication RPM et médias,
  protection du retrait, origines et installateur Linux.
- Revue visuelle sur desktop et mobile ; captures dans `.impeccable/screenshots/`.
- Lint sans erreur, avec deux avertissements préexistants hors refonte.

Les tests navigateur démarrent une base et un stockage isolés. Ils ne modifient
pas la base du Store. La migration de cette base doit être exécutée avec
`npm run db:migrate` avant démarrage de la version 1.0.0 ; aucun `.env` n’est
présent dans cet environnement. Le SSO externe Kyros réel n’a pas été exercé
par ces tests. La revue responsive et clavier ne constitue pas un audit WCAG complet.
