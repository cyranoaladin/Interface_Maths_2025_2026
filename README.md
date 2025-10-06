## Interface Maths 2025–2026 — Guide complet et auto‑déployable (Structure, Métier, Installation, Tests, Déploiement)

[![backend-ci](https://github.com/cyranoaladin/Interface_Maths_2025_2026/actions/workflows/backend-ci.yml/badge.svg?branch=main)](https://github.com/cyranoaladin/Interface_Maths_2025_2026/actions/workflows/backend-ci.yml)
[![deploy](https://github.com/cyranoaladin/Interface_Maths_2025_2026/actions/workflows/deploy.yml/badge.svg)](https://github.com/cyranoaladin/Interface_Maths_2025_2026/actions/workflows/deploy.yml)
[![Latest Tag](https://img.shields.io/github/v/tag/cyranoaladin/Interface_Maths_2025_2026?sort=semver)](https://github.com/cyranoaladin/Interface_Maths_2025_2026/tags)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

> Portail pédagogique complet (élèves, parents, enseignants) — Ressources Première/Terminale/Maths expertes, tableaux de bord, bilans d’évaluations, import CSV, authentification sécurisée, déploiement VPS en une commande.

---

## 1) Vue d’ensemble — objectifs et public

- Offrir un espace clair et moderne, 100% en français, pour consulter les ressources, suivre la progression, visualiser les bilans d’évaluations (élève) et gérer les groupes (enseignant).
- Frontend statique soigné (HTML/CSS/JS), Backend API FastAPI (Python) avec SQLite et SQLAlchemy, authentification JWT.
- Déploiement VPS reproductible: base (re)construite automatiquement grâce à un bootstrap en un script.

---

## 2) Architecture (monorepo simple)

- `site/` — Site public (HTML/CSS/JS). Sert aussi de racine de contenu pour les pages et ressources.
- `apps/backend/` — API FastAPI (Python 3.12), SQLite via SQLAlchemy, JWT, endpoints groupes/utilisateurs, scripts d’import/seed.
- `apps/frontend/` — Build vite/vue-tsc (expose des assets packagés recopiés vers `site/assets/`).
- `tests/` — Tests E2E Playwright (et tests unitaires JS/TS si présents).
- `deploy/` — Script de déploiement unique `deploy_all.sh` + exemples infra.

Schéma:

```
Interface_Maths_2025_2026/
  site/                       # HTML, CSS, JS (public)
  apps/
    backend/
      app/                    # FastAPI (routers, sécurité, db)
      data/app.db             # SQLite (créée auto)
      outputs/                # Exports CSV et journaux applicatifs
      scripts/                # import/export/seed/bootstrap
    frontend/                 # build vite (assets → site/assets)
  tests/                      # E2E Playwright
  deploy/deploy_all.sh        # Déploiement VPS one‑shot
```

---

## 3) Backend — Modèle, Auth, Endpoints, Scripts

- Framework: FastAPI (+ Starlette). ORM: SQLAlchemy 2.x. DB: SQLite (fichier géré par défaut).
- Utilisateurs: `User { id, email, full_name, role: teacher|student, hashed_password, is_active, created_at }`
- Groupes: `Group { id, code, name }` + table d’association `user_groups` (un élève peut être dans plusieurs groupes).
- Authentification: JWT (HS256), `OAuth2PasswordBearer`; hash mots de passe via `passlib` (bcrypt_sha256).

Endpoints principaux:

- `POST /auth/token` — login standard OAuth2 (username=email, password)
- `GET /auth/me` — profil courant
- `POST /auth/change-password` — changer son mot de passe
- `POST /auth/reset-student-password` — enseignant → réinitialise un élève sur « password123 »
- `GET /groups/` — liste des groupes (enseignant)
- `GET /groups/{code}/students` — élèves d’un groupe (enseignant)
- `GET /groups/my` — groupes associés à l’utilisateur courant (élève/enseignant)
- `GET /api/v1/session` — session compat (utilisée par le frontend `auth.js`)

Scripts disponibles (apps/backend/scripts/):

- `convert_ert_csv.py` — convertit CSV ERT bruts en CSV standard `email,full_name,groups` (séparateur adapté)
- `import_students.py` — import en base (crée élèves + associe groupes) et produit un CSV des mots de passe provisoires
- `seed_real_teacher.py` — crée l’enseignant réel et l’attache aux groupes (local)
- `bootstrap_prod.py` — bootstrap prod: schéma DB, groupes, enseignant (via env)

Bootstrap automatique au démarrage:

- Si `AUTO_BOOTSTRAP=1`, l’API crée le schéma et s’assure des groupes par défaut (T‑EDS‑3, P‑EDS‑6, MX‑1).

---

## 4) Frontend — Pages, Composants, Tableaux de bord

- Pages publiques: `index.html`, rubriques `EDS_premiere/`, `EDS_terminale/`, `Maths_expertes/`, progression, mentions, etc.
- Tableaux de bord:
  - Élève (`site/student.html`, `assets/js/student.js`):
    - « Ressources » (cartes EDS Première), « Changer mon mot de passe », bilans d’évaluations (lecture JSON et rendu stylé, filtrage par élève)
  - Enseignant (`site/dashboard.html`, `assets/js/dashboard.js`):
    - Liste des groupes → table des élèves (nom nettoyé, email)
    - Actions: « Voir bilan » (rendu carte détaillée), « Réinitialiser » (mot de passe)

Rendu des bilans (EDS Première, Second Degré):

- Source JSON: `site/EDS_premiere/Second_Degre/bilans_eval1second_degre.json`
- Filtrage: par email (si présent) ou par nom complet normalisé
- Mise en page: carte avec titre « Évaluation n°1 — Fonctions de second degré et forme canonique », date, mention, sections Points forts / Axes d’amélioration / Conseils / Appréciation / tableau des exercices.

---

## 5) Données élèves — Import/Export (CSV)

- Conversion (CSV ERT → standard):

```bash
python3 apps/backend/scripts/convert_ert_csv.py <src_ert.csv> apps/backend/outputs/students_P-EDS-6.csv P-EDS-6
python3 apps/backend/scripts/convert_ert_csv.py <src_ert.csv> apps/backend/outputs/students_T-EDS-3.csv T-EDS-3
python3 apps/backend/scripts/convert_ert_csv.py <src_ert.csv> apps/backend/outputs/students_MX-1.csv MX-1
```

- Import en base:

```bash
python3 apps/backend/scripts/import_students.py apps/backend/outputs/students_P-EDS-6.csv
python3 apps/backend/scripts/import_students.py apps/backend/outputs/students_T-EDS-3.csv
python3 apps/backend/scripts/import_students.py apps/backend/outputs/students_MX-1.csv
```

- Exports générés: `apps/backend/outputs/new_students_<timestamp>.csv` (mots de passe provisoires) et `apps/backend/outputs/export_students.csv` (séparateur `;`, compatible Excel FR).

---

## 6) Configuration (env) — Local & Prod

Variables importantes:

- `DATABASE_URL` (défaut: SQLite dans `apps/backend/data/app.db`)
- `CONTENT_ROOT` (défaut: `site/`)
- `STATIC_BASE_URL` (défaut: `/content`)
- `SERVE_STATIC` (dev: `true` pour servir `site/` via FastAPI; prod: `false`, Nginx sert `site/`)
- `SECRET_KEY` (JWT, prod: valeur longue et secrète)
- `AUTO_BOOTSTRAP` (`1` pour créer schéma + groupes au démarrage)
- `TEACHER_EMAIL`, `TEACHER_PASSWORD` (utilisés par `bootstrap_prod.py`)

Exemple `.env.production` (VPS):

```
AUTO_BOOTSTRAP=1
CONTENT_ROOT=/opt/interface_maths/site
STATIC_BASE_URL=/content
SERVE_STATIC=false
DATABASE_URL=sqlite:////opt/interface_maths/apps/backend/data/app.db
SECRET_KEY=change-me-long-and-random
TEACHER_EMAIL=alaeddine.benrhouma@ert.tn
TEACHER_PASSWORD=secret
```

---

## 7) Installation locale (avec API) et jeux d’essai

Créer venv backend et installer dépendances:

```bash
python3 -m venv apps/backend/.venv
. apps/backend/.venv/bin/activate
pip install -U pip
pip install -r apps/backend/requirements.txt
```

Build frontend et copier assets:

```bash
cd apps/frontend && npm ci || npm install && npm run build
cd ../.. && mkdir -p site/assets && rsync -a apps/frontend/dist/assets/ site/assets/
```

Démarrer l’API en dev (sert aussi `site/`):

```bash
SERVE_STATIC=1 uvicorn apps.backend.app.main:app --host 127.0.0.1 --port 8008
```

Jeux d’essai (optionnels): endpoint de test `POST /testing/ensure-teacher` (quand `TESTING=1`) — crée un enseignant et lie les groupes par défaut.

---

## 8) Tests — Unitaires & End‑to‑End

- E2E Playwright: 8 scénarios couvrent navigation, filtres, favoris, FR‑only, accessibilité, dashboard enseignant.
- Unitaires backend (pytest): sécurité, endpoints principaux, arborescence de contenu.

Commandes:

```bash
npx playwright install chromium
npm run test:e2e
. apps/backend/.venv/bin/activate && pytest -q apps/backend
```

---

## 9) Déploiement VPS (one‑shot script)

Sur le VPS (Ubuntu), une fois le dépôt synchronisé dans `/opt/interface_maths`:

```bash
cd /opt/interface_maths
bash deploy/deploy_all.sh
```

Ce script:

- Crée la venv, installe le backend
- Build le frontend et publie les assets vers `site/assets/`
- Bootstrape la base (schéma + groupes + enseignant réel via `TEACHER_EMAIL`/`TEACHER_PASSWORD`)
- Crée/active un service systemd `interface-maths` (API sur `127.0.0.1:8000`)
- Configure Nginx pour servir `site/` en `/content` et reverse‑proxy `/(api|auth|groups|api/v1)` vers l’API

Accès:

- Site: `http://<votre_domaine>/content/index.html`
- Connexion enseignant: `alaeddine.benrhouma@ert.tn` / `secret` (modifiez ensuite dans l’UI)

Reconstruction totale (disaster recovery):

```bash
rm -f /opt/interface_maths/apps/backend/data/app.db
cd /opt/interface_maths
. apps/backend/.venv/bin/activate
set -a; . .env.production; set +a
python3 apps/backend/scripts/bootstrap_prod.py
sudo systemctl restart interface-maths
```

---

## 10) Sécurité, qualité, accessibilité

- Hash mots de passe (bcrypt_sha256), JWT HS256 (clé secrète en prod), rôles `teacher`/`student`.
- ESLint/Prettier (frontend), Flake8 (backend), Playwright (E2E), pytest (backend).
- Accessibilité: FR‑only, focus visibles, labels, Lighthouse CI (perf/a11y/SEO) — seuils configurables.

---

## 11) Licence & contributions

- Licence **CC BY‑NC‑SA 4.0** (crédit, pas d’usage commercial, partage à l’identique).
- Contributions bienvenues (accessibilité, contenus, UX, tests, déploiement).

Lien: <https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr>
