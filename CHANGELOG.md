# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

## [Unreleased]
### Modifications
- Renommage du webroot `docs/` → `site/` et mise à jour des workflows (CI/Deploy) et du backend (CONTENT_ROOT par défaut)
- Déploiement: exclusion des PDF conservée; build frontend (si présent) puis copie des assets `apps/frontend/dist/assets/` → `site/assets/`
- Ajout d’une chaîne Docker (FastAPI + Nginx) et d’un workflow de build d’image (GHCR) sur tags SemVer
- CI backend: seuil de couverture ≥ 85%
- CI frontend: lint ESLint + Prettier (si frontend présent)

## [0.2.0] - 2025-09-07
### Modifications
- EDS Première — Calcul littéral: renumérotation logique des exercices (1→10), nettoyage des ancres et anciens numéros PDF, sous-exercices réordonnés.
- PDF régénéré depuis l’HTML mis à jour.
- CI: correction lychee (suppression de l’option obsolète, ajout de l’input "."), assouplissement flake8 (120 colonnes, ignore W391), corrections tests (imports inutiles, lignes longues).
- Publication GitHub Pages: pages EDS copiées sous `docs/` et liens corrigés dans `docs/index.html`.

## [0.1.0] - 2025-09-07
### Ajout
- Fiche élève: Généralités sur les suites (Rappels de Première)
  - `EDS_terminale/Suites/fiche_eleve_suites_rappels_premiere.html`
  - `EDS_terminale/Suites/fiche_eleve_suites_rappels_premiere.pdf`


