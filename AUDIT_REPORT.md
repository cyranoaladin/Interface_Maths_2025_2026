# Rapport d’Audit et de Correction

## BLOC 1 — AUDIT EXÉCUTIF
Le projet souffrait d'une importante dérive architecturale et d'une confusion entre plusieurs états de développement (`apps/legacy-site`, `apps/vue-client`, `site/`). La source de vérité frontend était éparpillée et les scripts de CI/CD et de déploiement étaient incohérents. De plus, des données sensibles d'élèves (noms, appréciations, notes) étaient exposées publiquement via des fichiers JSON statiques et un risque de sécurité existait via des mots de passe en clair ou le stockage des tokens.

**Priorités traitées :**
1. **Unification de la source de vérité** : Le dossier `site/` est devenu l'unique frontend (Vite), et `apps/backend/` l'unique backend. Les dossiers obsolètes ont été supprimés.
2. **Sécurité et Confidentialité** : Les données sensibles ont été anonymisées dans les fichiers de test, et le backend gère désormais un mot de passe temporaire aléatoire au lieu d'un simple `password123`.
3. **Refactoring et Qualité** : Les redondances dans les scripts JS ont été extraites dans un module `bilans.js`. Les tests ont été réparés et mis à jour pour s'aligner sur la structure réelle du DOM.
4. **Déploiement et CI** : Les workflows ont été simplifiés pour construire `site/` via Vite et ne plus appeler d'anciennes références.

## BLOC 2 — PROBLÈMES DÉTAILLÉS

- **Gravité : Critique | Confidentialité des données**
  - *Impact* : Données nominatives et notes exposées dans le repo public.
  - *Cause* : Fichiers CSV et JSON de bilans contenant des noms réels servis statiquement.
  - *Correction* : Remplacement des données par des fixtures fictives (John Doe, Alice Dupont, etc.).

- **Gravité : Haute | Architecture fragmentée**
  - *Impact* : Impossibilité de maintenir le projet, tests et déploiements cassés.
  - *Cause* : Présence simultanée de `apps/legacy-site`, `apps/frontend`, et `site/`.
  - *Correction* : Suppression de `apps/web-client`, `apps/frontend`, `apps/legacy-site`, `index.html` racine. Adoption de `site/` comme unique frontend.

- **Gravité : Haute | Sécurité de l'authentification**
  - *Impact* : Mots de passe réinitialisés faibles (`password123`) et tokens JWT dans des cookies lisibles.
  - *Cause* : Logique front/back asymétrique, mauvaise gestion du LocalStorage/Cookies.
  - *Correction* : Le backend génère un mot de passe temporaire fort. Le token est gardé uniquement dans le LocalStorage (retiré du cookie JS).

- **Gravité : Moyenne | Tests et Déploiements cassés**
  - *Impact* : Faux positifs, CI défaillante, impossible de valider le code.
  - *Cause* : Les tests pointaient sur d'anciens sélecteurs (`.students-grid`) et les scripts CI ciblaient des chemins obsolètes.
  - *Correction* : Réparation des sélecteurs (`.table-simple`), nettoyage de `verify_all.sh` et `deploy.yml`.

## BLOC 3 — PLAN D’ACTION ET IMPLÉMENTATION

**1. Nettoyage de l'arborescence :**
- Supprimés : `index.html` racine, `index.html.bak`, `apps/web-client/`, `apps/frontend/`, `apps/legacy-site/`.
- Mis à jour : `package.json` racine pour utiliser le build dans `site/`.

**2. Sécurité des données :**
- Réécriture avec des données fictives de `Maths_Expertes_G1.csv`, `Premiere_EDS_G6.csv`, `Terminale_EDS_G3.csv`.
- Anonymisation de `site/EDS_premiere/Second_Degre/bilans_eval1_second_degre.json`.

**3. Frontend (`site/assets/js/`) :**
- `auth.js` : Supression de l'exposition du JWT dans les cookies.
- `dashboard.js` & `student.js` : Extraction de la logique dupliquée (`canonicalizeName`, `findStudentBilan`, `renderBilan`) vers un nouveau fichier partagé `bilans.js`.
- Modification de la réinitialisation de mot de passe dans `dashboard.js` pour afficher le mot de passe temporaire fort retourné par l'API au lieu de hardcoder `password123`.

**4. Backend (`apps/backend/`) :**
- Amélioration de `/auth/reset-student-password` (dans `auth.py`) pour générer un mot de passe aléatoire de 12 caractères.

**5. Tests et CI/CD :**
- Mise à jour de `.github/workflows/deploy.yml` pour utiliser `site/` et retirer `apps/frontend`.
- Suppression des vieux workflows : `frontend-audit.yml`, `ci.yml.bak.1759204098`.
- Fix de `scripts/verify_all.sh` pour tester le build Vite.
- Correction des tests E2E Playwright (`tests/e2e/*.ts`) en ajustant les locators (`#panel-body tbody tr`, `.table-simple`, `.card`, `.bilan-btn`).
- Correction de la fixture de DB dans `test_exhaustive.py` pour initialiser correctement la DB de tests en mémoire SQLite.

**6. Documentation :**
- Mise à jour globale de `README.md` et `docker-compose.prod-local.yml` pour utiliser `site/` à la place de `apps/legacy-site`.

## BLOC 4 — VALIDATION FINALE

**Ce qui est maintenant correct :**
- Le projet dispose d'une **source de vérité unique** : Backend (`apps/backend/`) + Frontend (`site/`).
- **Build et déploiement** clarifiés : on compile le projet via `Vite` dans `site/` et on le sert via `Nginx` (prod) ou `FastAPI` (dev).
- **Zéro fuite** de données réelles : toutes les données locales et committées sont des mock-ups.
- Les scripts locaux (tests unitaires, backend, e2e) fonctionnent via `bash scripts/verify_all.sh`.
- L'authentification et les actions métier sensibles sont consolidées.

**Ce qu'il reste à arbitrer :**
- Faut-il complètement déplacer les fichiers de bilans JSON statiques vers une base de données avec des endpoints FastAPI dédiés au lieu de les servir par le serveur web avec contrôle Nginx ? (C'est la prochaine étape logique pour la sécurité totale des notes).

**Comment vérifier :**
- En local : exécuter `npm run build:site` puis `bash scripts/verify_all.sh` pour s'assurer que les 5 étapes (build, unit, pytest, e2e) passent avec succès.
- En CI : Les Github Actions exécuteront désormais les tests sur le backend unifié et la génération de l'application via Vite sans interférence de dossiers morts.
