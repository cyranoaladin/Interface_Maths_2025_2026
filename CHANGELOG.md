# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

## [Unreleased]
### Modifications
- (à renseigner)

## [0.4.1] - 2025-09-09
### Modifications
- Backend: paramètre configurable `OUTPUTS_DIR` (par défaut `apps/backend/outputs`) et création automatique du dossier.
- Refactor: écriture des fichiers sensibles (bootstrap credentials, import élèves) via `settings.OUTPUTS_DIR`.
- Docker: volume nommé `outputs:/outputs` et `OUTPUTS_DIR=/outputs` pour persistance hors image.
- CI (backend-ci): définition de `OUTPUTS_DIR=$RUNNER_TEMP/outputs` pour éviter les écritures dans le workspace et réduire le flakiness.
- Docs: README et deploy/README mis à jour (docs/ → site/, section dédiée aux outputs et aux règles de sécurité).
- Hygiène repo: suppression des artefacts cachés des commits futurs (pycache ignorés, outputs non versionnés).

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


