# Interface Maths 2025–2026 — Dossier technique complet (Audit + Amélioration)

[![backend-ci](https://github.com/cyranoaladin/Interface_Maths_2025_2026/actions/workflows/backend-ci.yml/badge.svg?branch=main)](https://github.com/cyranoaladin/Interface_Maths_2025_2026/actions/workflows/backend-ci.yml)
[![deploy](https://github.com/cyranoaladin/Interface_Maths_2025_2026/actions/workflows/deploy.yml/badge.svg)](https://github.com/cyranoaladin/Interface_Maths_2025_2026/actions/workflows/deploy.yml)
[![docker-image](https://github.com/cyranoaladin/Interface_Maths_2025_2026/actions/workflows/backend-docker.yml/badge.svg?branch=main)](https://github.com/cyranoaladin/Interface_Maths_2025_2026/actions/workflows/backend-docker.yml)
[![Latest Tag](https://img.shields.io/github/v/tag/cyranoaladin/Interface_Maths_2025_2026?sort=semver)](https://github.com/cyranoaladin/Interface_Maths_2025_2026/tags)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

> Site pédagogique (pas commercial) destiné aux élèves/parents/enseignants : ressources en spécialité mathématiques (Première, Terminale, Maths expertes), progressions annuelles, interface premium moderne et 100% en français.

---

## 1) Introduction (vision et public)

- Objectif: proposer un espace clair, accueillant et motivant pour les élèves, rassurant pour les parents, efficace pour les enseignants.
- Références UI: Linear, Vercel, Stripe, Notion (sobriété, spacing généreux, lisibilité, hiérarchie nette).
- Langue: intégralement en français (aucun bouton/texte anglais).

---

## 2) Architecture du projet

- Racine utile: `Interface_Maths_2025_2026/site/` (tout le site public se trouve ici).
- Sous-dossiers majeurs:
  - `assets/css/site.css` — Design system et styles globaux
  - `assets/js/` — Logique métier (sommaire, listes de niveau, progression, icônes, thèmes)
  - `assets/contents.json` et `assets/contents.static.js` — Index statiques des contenus
  - `EDS_premiere/`, `EDS_terminale/`, `Maths_expertes/` — Rubriques et pages Progression
  - `manifest.webmanifest`, `sw.js` — PWA (service worker actif en HTTP/HTTPS)

---

## 3) Charte graphique (design tokens)

- Typographies:
  - Titres (H1): Poppins SemiBold 48px
  - H2: Inter Medium 32px — H3: Inter Medium 24px
  - Corps: Inter 16px — Small: Inter 14px
- Couleurs:
  - Primaires: Bleu `#2563eb`, Violet `#7c3aed`, Cyan `#06b6d4`
  - Arrière-plans: `--bg`, `--card`, `--text`, `--muted`, `--border`, `--accent` (clair/sombre + override `html[data-theme]`)
- Thèmes et effets:
  - Radius: cartes 24px, sections 28px
  - Ombres: `--ds-shadow-default`, glow premium au hover `--ds-shadow-glow`
  - Spacings: XS 8px → XXL 64px (respiration large)
- Tags disciplinaires (badges):
  - Analyse `#22c55e`, Probabilités `#f97316`, Géométrie `#8b5cf6`, Arithmétique `#ec4899`, Algèbre `#3b82f6`, Trigonométrie `#eab308`

---

## 4) Structure de l’interface

### 4.1 Hero (Accueil)

- Titre: « Interface Maths 2025–2026 »
- Sous-titre: « Ressources et progressions pour accompagner les élèves en spécialité mathématiques au lycée. »
- Citation inspirante (italique, rotation automatique — mathématiciens)
- Illustration: mesh gradient premium (violet/cyan/bleu) + formes géométriques/symboles (π, ∑, ∫)
- CTAs: « Première », « Terminale », « Maths expertes »

### 4.2 Accès rapide

- 3 grandes cartes modernes (icônes Lucide, fond contrasté, hover lumineux)
- Libellés sobres:
  - EDS Première → Ressources + Progression
  - EDS Terminale → Ressources + Progression
  - Maths expertes → Ressources + Progression

### 4.3 Sommaire (chapitres et ressources)

- Grille responsive: 3 colonnes (desktop), 2 (tablette), 1 (mobile)
- Cartes premium (radius 24px, ombre, glow au hover)
- Contenu carte: grande icône Lucide colorée (par type), titre, description courte académique, badges tags, ⭐ favori flottant
- Filtres: chips par type (Cours, Fiche, Exercices, Éval, Article) et par thème (Analyse, Algèbre, Géométrie, Probabilités, Trigonométrie, Arithmétique)
- Recherche: accent-insensible, suggestions (autosuggest) avec groupe de rubrique

### 4.4 Timeline progression

- Ligne centrale lumineuse (dégradé violet/bleu/cyan)
- Jalons alternés gauche/droite: icône (∑, ∞, ∫…), titre, durée (semaines), badges ressources liés
- Vue alternative grille: cartes numérotées avec durées et liens

### 4.5 Footer

- Fond contrasté, gradient léger
- Liens: « Mentions légales », « Crédits »
- Mini-citation: « Les mathématiques sont la poésie des sciences. » — Karl Weierstrass

---

## 5) Logique métier (JS) — comportements interactifs et attentes utilisateur

### 5.1 Sommaire d’accueil — `assets/js/contents.js`

- Rôle: charger/regrouper `assets/contents.json`/`assets/contents.static.js` (ou `/api/tree` si présent), rendre les cartes filtrables, suggestions et favoris.
- Ordre de chargement (robuste): `contents.static.js` (priorité `file://`) → `contents.json` → API `/api/tree`.
- Normalisation et typage:

```js
function normalize(str) {
  return (str || "")
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .toLowerCase();
}
function computeType(it) {
  const t = normalize(it.title);
  if (/\bcours\b/.test(t)) return "Cours";
  if (/(\bfiche\b|mémo|méthodo)/.test(t)) return "Fiche";
  if (/exercices?/.test(t)) return "Exercices";
  if (/(éval|evaluation|corrigé|corrige)/.test(t)) return "Éval";
  if (/article|note/.test(t)) return "Article";
  return "";
}
```

- Champs et interactions attendues (utilisateur):
  - Recherche: l’utilisateur peut taper une requête (accent-insensible). Au-delà de 2 caractères, une liste de suggestions s’affiche (jusqu’à 8), chaque suggestion mène vers l’URL de la ressource (nouvel onglet).
  - Filtres chips: deux groupes (« Type », « Thème »). Un clic active/désactive la puce; l’état `aria-pressed` est tenu à jour. Les résultats se mettent à jour en direct.
  - Favoris: l’icône cœur dans chaque carte bascule l’état favori (persisté dans `localStorage` clé `favorites`). Le filtre « Mes favoris » (onglet) restreint l’affichage aux favoris.
  - Réinitialisation: le bouton « Réinitialiser les filtres » vide la recherche, désactive tous les chips, réinitialise l’onglet « Tous » et recalcule la grille.
  - Ancre `#favoris`: si l’URL contient `#favoris`, l’onglet « Mes favoris » est pré‑activé au chargement.

### 5.2 Listes de niveau — `assets/js/levels.js`

- Rôle: afficher les ressources d’une rubrique (Première/Terminale/Maths expertes) avec recherche/filtre/favoris.
- Sources: `../assets/contents.json` puis fallback `../assets/contents.static.js` (support `file://`).
- Correction automatique des liens relatifs (contexte « page de niveau »):

```js
const raw = (it.url || "").replace(/^\/+/, "");
link.href = /^https?:\/\//.test(raw) ? raw : "../" + raw;
```

- Interactions attendues (utilisateur):
  - Recherche intra‑niveau: champ `#level-search` filtre les cartes du niveau courant (mêmes règles de normalisation).
  - Filtres: chips par type et thème disponibles (mêmes comportements et états qu’en accueil).
  - Réinitialisation: `#level-reset-filters` remet la vue à zéro.
  - Navigation: chaque carte ouvre la ressource correspondante. Les cœurs de favoris sont disponibles et persistent inter‑pages (même `localStorage`).

### 5.3 Progression (timeline + grille) — `assets/js/progression.js`

- Rôle: scanner les tables de chapitres dans la page Progression, construire timeline alternée et grille.
- UX et attentes:
  - Timeline: jalons alternés (gauche/droite) avec lien d’ancrage vers la ligne du tableau d’origine. Icône, titre, durée, badges (Cours/Fiche/Exercices) affichés.
  - Grille: cartes numérotées avec durées et liens vers les ressources.
  - Si vide: afficher un message engageant « Explore tes ressources, et tes progrès s’afficheront ici ! » (sur les pages progression), ne rien afficher d’intrusif sur l’accueil.

### 5.4 Thèmes et mode néon — `assets/js/theme-toggle.js`, `assets/js/neon-toggle.js`

- `theme-toggle.js` gère un cycle de thèmes via l’attribut `html[data-theme]` (persisté dans `localStorage`):
  - Ordre: `dark` → `light` → `energie` → `pure` (palettes alternatives documentées en §3 et §11).
  - Le libellé du bouton est mis à jour: « Thème: sombre/clair/énergie/pur ».
- `neon-toggle.js` ajoute un glow discret en activant `html[data-neon="on"]`.

---

## 6) Guide d’utilisation — Élève

- Trouver un chapitre:
  - Accueil → Sommaire → utiliser la recherche (ex: « suites ») ou les chips par thème
- Filtrer les ressources:
  - Chips « Type » (Cours, Fiche, Exercices, Éval, Article) et « Thèmes » (Analyse, Algèbre, …)
- Ajouter aux favoris:
  - Bouton ⭐ sur chaque carte (persistance locale)
- Voir la progression:
  - Rubrique → bouton « Progression » → timeline + grille

Cas d’usage concrets:

- « Où trouver une fiche de révision sur les suites ? » → Accueil → rechercher « suites » → filtrer Type « Fiche » → ouvrir « Fiche élève — Suites numériques ».
- « Comment réviser le second degré ? » → Accueil → Sommaire → carte « Cours complet — Second degré » (description: « Polynômes, égalités et méthodes ») → ajouter aux favoris pour accès rapide.
- « Naviguer la progression de Terminale » → Terminale → Progression → jalons et badges pour accéder aux ressources de la séquence.

---

## 7) Guide technique — Développeurs

- Composants pages:
  - Hero, Accès rapide, Sommaire (accueil)
  - Listes de ressources (par niveau)
  - Progression (timeline + grille)
  - Footer
- Tokens & styles:
  - Voir `assets/css/site.css` (variables, thèmes, radius/ombres, utilitaires)
- Icônes:
  - Lucide via CDN, initialisé par `assets/js/icons.js`
- Thèmes & mode néon:
  - `theme-toggle.js`, `neon-toggle.js` (attributs `html[data-theme]`, `html[data-neon]`). Deux palettes alternatives: « Énergie & Créativité » (fond #121212, violet #6A0DAD, accent #FFD700) et « Pureté & Minimalisme » (fond #212121, marine #174D8C, accent #4DFFC9).

### 7.1 Données et contenus

- Indexation: mettre à jour `assets/contents.json` (et `assets/contents.static.js`) lors d’ajouts/suppressions.
- Nommage: titres de cartes explicites (« Cours complet — Second degré », « Fiche élève — Suites numériques », « Exercices corrigés — Calcul littéral ») pour de bonnes descriptions automatiques.

### 7.2 Accessibilité et i18n

- Langue: attribut `lang="fr"` sur toutes les pages, textes en français uniquement (tests E2E bloquants).
- Focus: styles visibles pour tabulation (`:focus-visible`), labels pour champs.
- Icônes: Lucide (SVG) initialisées par `assets/js/icons.js`.

Installation locale rapide (serveur statique):

```bash
python3 -m http.server --directory Interface_Maths_2025_2026/site 8000
# http://127.0.0.1:8000/
```

Stack Docker (optionnelle):

```bash
docker compose -f deploy/docker/docker-compose.yml up -d --build
curl http://localhost/content/index.html
curl http://localhost/api/tree
```

---

## 8) Tests — Unitaires & E2E

- Unitaires (Vitest, jsdom): composants DOM génériques, rendu `contents.js` (fallback statique), classes attendues
- E2E (Playwright): navigation (Accueil → Première → Ressources → Progression → Retour), recherche/filtre/favoris, timeline, accessibilité (axe-core), langue française

Scénarios E2E détaillés attendus:

- Navigation: Accueil → carte « Spécialité Maths – Terminale » → bouton « Progression » (nav header) → retour « Accueil ».
- Recherche et suggestions: saisir « cours », attendre les suggestions, cliquer sur une suggestion, vérifier l’ouverture.
- Filtres et reset: activer un chip Type, activer un chip Thème, cliquer « Réinitialiser les filtres », vérifier état.
- Favoris: activer le cœur, recharger la page, vérifier persistance.
- FR only: vérifier absence de mots anglais dans les pages `lang="fr"`.

Commandes:

```bash
npm run test:unit
npx playwright install chromium
npm run test:e2e
```

Exemples de vérifications à exiger:

- Boutons CTA mènent aux bonnes pages
- Chaque carte contient un titre + description + tags
- Bouton « Réinitialiser les filtres » remet recherche + chips à zéro
- Aucune chaîne anglaise dans les pages `lang="fr"`

---

## 9) Sécurité & bonnes pratiques

- 0 secret en clair, chargements externes en HTTPS
- `manifest.webmanifest` + `sw.js` actifs uniquement via HTTP/HTTPS
- Mettre à jour `assets/contents.json`/`assets/contents.static.js` après ajout/suppression de fiches
- Nommage de fichiers explicites (permalien stable)

---

## 10) Contributeurs & licence

- Projet pédagogique sous licence **CC BY-NC-SA 4.0** (Crédit, Pas d’usage commercial, Partage à l’identique)
- Contributions: PR bienvenues pour améliorer l’accessibilité, la lisibilité, la qualité des contenus et des tests

Lien licence: <https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr>

---

## 11) Annexes — Design tokens alternatifs (palettes)

### 11.1 Énergie & Créativité

- Fond: `#121212`, Carte: `#1f1f33`
- Texte: `#F5F5F5`, Muted: `#BDBDBD`
- Titre/Accent: Violet `#6A0DAD`, Accent doré `#FFD700`
- Usage: sites dynamiques, engageants; bon contraste avec cœurs/focus dorés.

### 11.2 Pureté & Minimalisme

- Fond: `#212121`, Carte: `#2a2a2a`
- Texte: `#FFFFFF`, Muted: `#E0E0E0`
- Titre/Accent: Marine `#174D8C`, Accent menthe `#4DFFC9`
- Usage: rendu sobre, professionnel, focus sur lisibilité et structure.
