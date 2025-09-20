## [1.2.0](https://github.com/cyranoaladin/Interface_Maths_2025_2026/compare/v1.1.0...v1.2.0) (2025-09-20)


### Features

* **maths_expertes:** anchors P1–P7 + DE theorem; plan sublinks; proofs toggle button ([ee2875e](https://github.com/cyranoaladin/Interface_Maths_2025_2026/commit/ee2875ed9036b0f16ee37d5d22a9dca8d81e1ee2))

## [1.1.0](https://github.com/cyranoaladin/Interface_Maths_2025_2026/compare/v1.0.3...v1.1.0) (2025-09-20)


### Features

* **maths_expertes:** add rigorous proofs P1–P4 (divisibilité), division euclidienne (existence+unicité), and congruences (def, P6, P7) ([7a120e9](https://github.com/cyranoaladin/Interface_Maths_2025_2026/commit/7a120e9d66df61d3b9a41c76e9e544a1d3cd0929))

## [1.0.3](https://github.com/cyranoaladin/Interface_Maths_2025_2026/compare/v1.0.2...v1.0.3) (2025-09-20)

## [1.0.2](https://github.com/cyranoaladin/Interface_Maths_2025_2026/compare/v1.0.1...v1.0.2) (2025-09-20)


### Bug Fixes

* **cours_suites:** remove undefined w-100 class and widen table via style; include div.section in TOC injection selector ([d879e1e](https://github.com/cyranoaladin/Interface_Maths_2025_2026/commit/d879e1e49fdcc690503d00f670f988581c8f0dbd))

## [1.0.1](https://github.com/cyranoaladin/Interface_Maths_2025_2026/compare/v1.0.0...v1.0.1) (2025-09-20)

## 1.0.0 (2025-09-20)

## [0.5.2](https://github.com/cyranoaladin/Interface_Maths_2025_2026/compare/v0.5.1...v0.5.2) (2025-09-12)

## [0.5.1](https://github.com/cyranoaladin/Interface_Maths_2025_2026/compare/v0.5.0...v0.5.1) (2025-09-12)

## [0.5.0](https://github.com/cyranoaladin/Interface_Maths_2025_2026/compare/v0.4.8...v0.5.0) (2025-09-12)


### Features

* **css:** extract inline styles (Maths expertes — chap1) to shared CSS\n\n- Add utilities: .mt-4,.mt-6,.mt-8,.mt-10,.mb-0,.w-100,.pre-wrap\n- Replace remaining inline styles (margins, width, pre-wrap) ([#9](https://github.com/cyranoaladin/Interface_Maths_2025_2026/issues/9)) ([e0ffed5](https://github.com/cyranoaladin/Interface_Maths_2025_2026/commit/e0ffed5980d0bfe6b44d8545cfcf5931b9b7f234))
* **css:** extract inline styles (table, footer) to shared CSS\n\n- Add .table-simple and .mt-22 utilities\n- Replace inline styles in EDS Première Calcul littéral fiche ([#7](https://github.com/cyranoaladin/Interface_Maths_2025_2026/issues/7)) ([0d5308c](https://github.com/cyranoaladin/Interface_Maths_2025_2026/commit/0d5308c5721a86f84b9bbd1039da2b8ad9fa905e))
* **css:** extract inline styles (Terminale/Suites) to shared CSS\n\n- Add .mb-8 utility\n- Replace inline margin styles by class utilities (.mb-8, .mt-22) ([#8](https://github.com/cyranoaladin/Interface_Maths_2025_2026/issues/8)) ([5210bee](https://github.com/cyranoaladin/Interface_Maths_2025_2026/commit/5210beefddd08c00768b48ad23120ca461e188e0))
* **print:** add global print styles (hide UI, flatten layout, expand details) ([#10](https://github.com/cyranoaladin/Interface_Maths_2025_2026/issues/10)) ([cfeb82e](https://github.com/cyranoaladin/Interface_Maths_2025_2026/commit/cfeb82e7b7136308827eee90a98324f8a79db4a6))
* **site:** remove inline style, add theme toggle and explicit dark/light overrides\n\n- Remove inline margin on h1 (now in CSS)\n- Add theme toggle button and JS (persisted in localStorage)\n- Add html[data-theme] overrides for dark/light ([#6](https://github.com/cyranoaladin/Interface_Maths_2025_2026/issues/6)) ([6b34db0](https://github.com/cyranoaladin/Interface_Maths_2025_2026/commit/6b34db0eb71c93eaba2fb1615a5e4766e76d844c))


### Bug Fixes

* CSS .pre-wrap + MathJax escapes in Seconde fiche ([#14](https://github.com/cyranoaladin/Interface_Maths_2025_2026/issues/14)) ([f5d93d1](https://github.com/cyranoaladin/Interface_Maths_2025_2026/commit/f5d93d1fa0d91ab4721722f91a424cfe1af2efbd))

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
