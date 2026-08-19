---
name: LUMA Store
description: Un store logiciel familier qui rend la compatibilite et l'integrite immediatement lisibles.
colors:
  mineral-canvas: "#f7f7fb"
  pure-surface: "#ffffff"
  mineral-subtle: "#f0f0f7"
  aubergine-ink: "#17182f"
  slate-muted: "#626477"
  mist-line: "#e2e2eb"
  luma-iris: "#5b5ceb"
  deep-iris: "#4142bd"
  iris-wash: "#ebebff"
  verified-green: "#147a52"
  caution-amber: "#9b5c00"
  withdrawal-red: "#b42337"
typography:
  display:
    fontFamily: "Sora, sans-serif"
    fontSize: "clamp(2.8rem, 5vw, 4.7rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Sora, sans-serif"
    fontSize: "clamp(1.8rem, 3vw, 2.6rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Sora, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 750
    lineHeight: 1.3
    letterSpacing: "normal"
rounded:
  tag: "7px"
  filter: "9px"
  control: "10px"
  search: "12px"
  card: "14px"
  icon: "15px"
  panel: "16px"
  detail-icon: "24px"
  pill: "999px"
spacing:
  xs: "5px"
  sm: "8px"
  control: "10px"
  md: "12px"
  card-gap: "18px"
  lg: "24px"
  xl: "32px"
  section: "48px"
  shell: "64px"
components:
  button-primary:
    backgroundColor: "{colors.luma-iris}"
    textColor: "{colors.pure-surface}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 17px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.deep-iris}"
    textColor: "{colors.pure-surface}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 17px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.pure-surface}"
    textColor: "{colors.aubergine-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 17px"
    height: "44px"
  search-field:
    backgroundColor: "{colors.pure-surface}"
    textColor: "{colors.aubergine-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.search}"
    padding: "0 15px"
    height: "44px"
  category-chip:
    backgroundColor: "{colors.pure-surface}"
    textColor: "{colors.aubergine-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  category-chip-active:
    backgroundColor: "{colors.aubergine-ink}"
    textColor: "{colors.pure-surface}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  platform-filter:
    backgroundColor: "{colors.pure-surface}"
    textColor: "{colors.slate-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.filter}"
    padding: "8px 13px"
    height: "38px"
  platform-filter-active:
    backgroundColor: "{colors.iris-wash}"
    textColor: "{colors.deep-iris}"
    typography: "{typography.label}"
    rounded: "{rounded.filter}"
    padding: "8px 13px"
    height: "38px"
  app-card:
    backgroundColor: "{colors.pure-surface}"
    textColor: "{colors.aubergine-ink}"
    rounded: "{rounded.card}"
    padding: "22px"
    width: "355px"
  platform-tag:
    backgroundColor: "{colors.mineral-subtle}"
    textColor: "{colors.slate-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "0 7px"
    height: "25px"
  input-field:
    backgroundColor: "{colors.pure-surface}"
    textColor: "{colors.aubergine-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "11px 12px"
---

# Design System: LUMA Store

## Overview

**Creative North Star: "Le Rayon officiel"**

LUMA Store est un store contemporain familier, traite comme un point de distribution officiel plutot que comme une vitrine publicitaire. Son monde visuel associe des surfaces minerales presque blanches, une encre aubergine tres sombre et l'iris LUMA pour rendre la provenance, la compatibilite et l'action immediatement reconnaissables.

La composition reste aeree mais informative : recherche centrale, rails horizontaux d'applications, icones optiques et controles qui reprennent les reflexes des stores natifs. L'identite s'exprime par la precision des hierarchies, les cartes en leger relief et l'illustration orbitale des plateformes, sans masquer les informations de version ou d'integrite.

**Key Characteristics:**

- Store logiciel clair, confiant et non promotionnel.
- Surfaces minerales, encre aubergine et accent iris rare mais decisif.
- Recherche, filtres de plateforme et rails d'applications visibles tres tot.
- Compatibilite et integrite traitees comme du contenu principal.
- Geometrie doucement arrondie et mouvement bref, avec reduction d'animation respectee.

## Colors

La palette combine un fond mineral froid et des surfaces blanches a une encre aubergine; l'iris LUMA guide les actions et les etats actifs, tandis que les couleurs semantiques restent reservees aux statuts.

### Primary

- **Iris LUMA:** Accent de marque, actions primaires, glyphes de confiance et mots-clefs de grands titres.
- **Iris profond:** Etat de survol, liens fonctionnels et texte d'un filtre actif.
- **Lavis iris:** Fond des controles selectionnes et halo de focus, jamais grande surface decorative.

### Tertiary

- **Vert verifie:** Confirmation, etat publie et provenance validee.
- **Ambre de vigilance:** Avertissement de configuration ou apercu local.
- **Rouge de retrait:** Action destructive, etat retire et message d'erreur.

### Neutral

- **Toile minerale:** Fond general de l'application et couche translucide de l'en-tete fixe.
- **Surface pure:** Cartes, champs, bandeau de confiance et panneaux qui doivent se detacher de la toile.
- **Mineral discret:** Tags, controles iconiques et fonds fonctionnels de faible emphase.
- **Encre aubergine:** Texte principal, categorie active et code sombre.
- **Ardoise attenuee:** Texte secondaire, metadonnees et controles inactifs.
- **Ligne de brume:** Separateurs, bordures de champs et structure sans ombre.

### Named Rules

**The Official Iris Rule.** L'iris signale la marque, une action ou une selection; il ne devient jamais un remplissage decoratif de page.

**The Status Has a Name Rule.** Un etat semantique conserve toujours un libelle ou une icone explicite; la couleur seule ne porte jamais l'information.

## Typography

**Display Font:** Sora (avec repli sans-serif)  
**Body Font:** Manrope (avec repli sans-serif)

**Character:** Sora apporte une autorite geometrique aux titres et a la marque; Manrope garde la recherche, les metadonnees et les formulaires denses mais calmes. Le contraste vient surtout de la famille, du poids et de l'espacement, pas d'une multiplication de styles.

### Hierarchy

- **Display** (graisse 700, taille fluide, interligne serre): hero et grands titres de detail; une seule declaration dominante par vue.
- **Headline** (graisse 700, taille fluide, interligne compact): entrees de sections comme le catalogue ou l'administration.
- **Title** (graisse 700, corps compact): titres de rails, panneaux et groupes d'informations.
- **Body** (graisse 400, interligne 1.5): descriptions et contenu courant, limite a environ 63-72 caracteres sur les lectures longues.
- **Label** (graisse 750, petit corps): boutons, filtres, statuts et controles; les tableaux peuvent passer en capitales avec un espacement modere.

### Named Rules

**The Two-Voice Rule.** Sora porte la structure et Manrope porte l'usage; aucune troisieme voix typographique n'est introduite hors du code monospace.

**The Tight Display Rule.** Les grands titres utilisent une chasse serree et des retours equilibres, mais le corps conserve un rythme normal pour la lisibilite.

## Layout

Le contenu public est centre dans un conteneur de 1180px, avec des marges fluides de 24px puis 16px sur petit ecran. L'en-tete peut atteindre 1280px et place la marque, une recherche centrale dominante et les destinations principales sur une grille en trois zones. Le hero juxtapose texte et scene de plateformes, puis le catalogue utilise des rails horizontaux de cartes de 355px avec accrochage au defilement.

Sous 900px, l'en-tete passe sur deux lignes, les compositions principales deviennent monocolonnes et l'administration abandonne sa barre laterale fixe. Sous 620px, les actions du hero occupent toute la largeur, la scene orbitale disparait, les garanties et les cartes deviennent des rails tactiles, et les formulaires passent a une colonne. Les cibles principales conservent au moins 44px de hauteur.

**The First-Rail Rule.** La recherche, l'introduction et le debut du catalogue doivent rester perceptibles sans transformer le premier viewport en affiche publicitaire.

**The Horizontal Continuity Rule.** Sur petit ecran, filtres, garanties et cartes defilent lateralement plutot que de s'ecraser ou de produire des colonnes trop etroites.

## Elevation & Depth

Le systeme est plat par defaut et utilise les lignes et les changements de ton pour sa structure. Une ombre ambiante apparait uniquement sur les cartes interactives, les etiquettes flottantes, le panneau de connexion et l'action primaire; le logo peut recevoir une ombre portee plus profonde pour former le centre optique de la scene.

### Shadow Vocabulary

- **Ambient card** (`0 12px 32px rgba(23, 24, 47, .09)`): survol d'une carte, etiquette de plateforme ou panneau isole.
- **Primary action** (`0 8px 20px rgba(91, 92, 235, .22)`): bouton principal au repos; il gagne legerement en diffusion au survol.
- **Logo depth** (`drop-shadow(0 24px 30px rgba(24, 24, 58, .17))`): logo central et rien d'autre.
- **Focus halo** (`0 0 0 4px var(--accent-soft)`): groupe de recherche actif, complete par la bordure iris.

### Named Rules

**The Lift on Intent Rule.** Une surface ne se souleve qu'en reponse a l'intention, au focus ou lorsqu'elle flotte reellement dans la composition.

## Shapes

Les controles sont doucement arrondis, les cartes emploient un rayon legerement plus genereux et les icones d'applications forment des carreaux plus optiques encore. Les chips de categorie sont les seules capsules completes. Les contours restent fins et froids; un contour en tirets est reserve a l'etat vide, jamais aux cartes ordinaires.

**The Radius Ladder Rule.** Les tags sont les plus compacts, les controles viennent ensuite, les cartes et icones ferment la progression; ne pas appliquer une capsule universelle a tous les elements.

## Components

### Buttons

- **Shape:** Rectangle tactile compact aux coins doux, hauteur minimale de 44px.
- **Primary:** Iris LUMA sur texte blanc, avec une ombre coloree basse et un poids affirmatif.
- **Hover / Focus:** Translation verticale de 2px et iris profond au survol; contour de focus global de 3px avec decalage de 3px.
- **Secondary:** Surface blanche cernee par une ligne interieure, sans concurrencer l'action primaire.
- **Danger:** Rouge de retrait et libelle explicite; la confirmation precede les suppressions irreversibles.

### Chips

- **Category:** Capsule blanche a bordure froide; l'etat courant devient aubergine avec texte blanc.
- **Platform filter:** Controle moins rond et plus natif; l'etat courant utilise un lavis iris et du texte iris profond.
- **Platform tag:** Petit marqueur technique, compact et capitalise, pose sur un fond mineral discret.

### Cards / Containers

- **Corner Style:** Carte d'application doucement arrondie; les panneaux isoles sont parfois legerement plus ronds.
- **Background:** Surface pure sur toile minerale.
- **Shadow Strategy:** Aucune ombre au repos; elevation ambiante au survol.
- **Border:** Transparente au repos, tres legerement iris au survol.
- **Internal Padding:** 22px pour la carte canonique.

### Inputs / Fields

- **Style:** Surface blanche, bordure froide fine, coins doux et texte aubergine.
- **Focus:** Bordure iris et halo lavis iris pour la recherche; tous les champs gardent le contour `:focus-visible` global.
- **Error / Disabled:** Message rouge sur lavis rouge; les controles indisponibles reduisent leur opacite sans perdre leur libelle.

### Navigation

L'en-tete reste fixe et translucide, avec une marque compacte a gauche, la recherche comme controle central et des liens fermes a droite. Le survol passe a l'iris profond. Sur tablette, la recherche occupe une seconde ligne; sur mobile, le lien d'administration conserve son icone tandis que son texte s'efface.

### Application Card

La carte associe une icone de 64px, le nom et l'editeur, un resume, puis les plateformes et la version en pied. Elle reste une cible unique, se souleve de 5px au survol et s'accroche au rail sur mobile. Les fonds pastel des icones donnent de la variete sans rivaliser avec l'iris de marque.

## Do's and Don'ts

### Do:

- **Do** faire apparaitre la compatibilite et l'integrite avant ou au meme niveau que l'action de telechargement.
- **Do** reserver Sora aux titres, a la marque et aux reperes structurels; utiliser Manrope pour l'usage courant.
- **Do** conserver un contraste lisible, un focus visible et un libelle textuel pour chaque etat semantique.
- **Do** transformer les groupes denses en rails horizontaux tactiles sur petit ecran.
- **Do** respecter `prefers-reduced-motion` pour toutes les animations et transitions.

### Don't:

- **Don't** transformer le store en catalogue publicitaire, en mosaïque promotionnelle ou en page de campagne.
- **Don't** utiliser l'iris, les ombres ou les capsules sur chaque element; leur rarete construit la hierarchie.
- **Don't** cacher la plateforme, la version ou la provenance derriere une interaction secondaire.
- **Don't** inventer de volumes de telechargement, de disponibilite ou de preuve sociale absents du produit.
- **Don't** transmettre un statut uniquement par sa couleur.
