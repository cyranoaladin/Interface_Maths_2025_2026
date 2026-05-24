# Audit architecture, authentification et dashboards

Date d'audit : 2026-05-24  
Depot audite : `cyranoaladin/Interface_Maths_2025_2026`

## 1. Architecture actuelle reelle

Le depot Git courant est une photographie de production. L'application historique `Interface_Maths_2025_2026` n'est pas a la racine du depot, elle est imbriquee sous :

- `var-www/maths.labomaths.tn/Interface_Maths_2025_2026/`

La racine contient aussi des elements de deploiement hors application historique :

- `etc-nginx/` : configuration Nginx de production et snippet local pour le header d'authentification de l'API correction.
- `opt/math-correction/` : application separee de correction, avec backend et frontend dedies.
- `var-www/maths/` : copie statique de site deploye.
- `metadata/`, `dumps/`, `README_LOCAL_COPY.md` : contexte de snapshot.

Dans l'application historique, l'architecture effective est hybride :

- `README.md` decrit une plateforme statique `site/`, un backend `apps/backend/`, des tests et un deploiement Docker/Nginx.
- `apps/backend/app/main.py` cree l'application FastAPI, monte les routers `auth`, `groups`, `testing`, `compat`, expose `/api/tree` et peut servir `site/` si `SERVE_STATIC=True`.
- `apps/backend/app/orm.py` contient les tables SQLAlchemy `User`, `Group` et l'association `user_groups`.
- `apps/backend/app/security.py` gere les JWT, `OAuth2PasswordBearer`, `get_current_user` et `require_teacher`.
- `apps/backend/app/routers/auth.py` expose `/auth/token`, `/auth/me`, `/auth/me/groups`, `/auth/admin/users`, `/auth/change-password`, `/auth/reset-student-password`.
- `apps/backend/app/routers/groups.py` expose `/groups/`, `/groups/{code}/students`, `/groups/my`, `/groups/{code}/seed-test`, `/groups/{code}/evaluations`.
- `apps/backend/app/routers/compat.py` maintient les endpoints legacy `/api/v1/login`, `/api/v1/login-form`, `/api/v1/session`, `/api/v1/change-password`, `/api/v1/logout`.
- `site/` contient les pages statiques publiques et privees : `login.html`, `student.html`, `dashboard.html`, `ressources.html`, `evaluations.html`, `index.html`, les pages de cours `EDS_premiere`, `EDS_terminale`, `Maths_expertes`.
- `site/assets/js/auth.js`, `student.js`, `dashboard.js`, `contents.js`, `bilans.js` portent encore une partie importante de la logique applicative cote navigateur.
- `tests/` contient des tests backend et Playwright a la racine applicative ; `apps/backend/tests/` contient aussi des tests backend plus anciens.
- `deploy/` contient des configurations Docker, Compose et Nginx pour production.

`apps/vue-client/` n'est pas present dans la copie auditee, malgre la mention historique dans le README.

## 2. Points forts

- Le backend FastAPI existe deja et couvre les bases : login JWT, utilisateur courant, groupes, changement de mot de passe et reset enseignant.
- Le modele SQLAlchemy a deja la relation many-to-many `User` / `Group`, utile pour les groupes `P-EDS-6`, `T-EDS-3`, `MX-1`.
- `apps/backend/app/main.py` refuse un `SECRET_KEY` absent en `APP_ENV=production`, et refuse `CORS_ORIGINS="*"` en production.
- Les endpoints legacy `/api/v1/*` preservent la compatibilite avec le frontend existant.
- Les pages statiques pedagogiques sont nombreuses et organisees par niveau et chapitre dans `site/`.
- `site/assets/js/bilans.js` centralise une partie du rendu et de la recherche des bilans.
- `.gitignore` exclut les dossiers sensibles ou lourds : `.venv/`, `node_modules/`, `site/dist/`, `apps/backend/data/*.db*`, `apps/backend/outputs/`, `test-results/`.
- Les workflows GitHub existent deja : `ci.yml`, `deploy.yml`, `monitor.yml`, `release.yml`, `lighthouse-ci.yml`.

## 3. Points faibles

- L'application est imbriquee dans un snapshot de production, ce qui rend les chemins, scripts et commandes ambigus.
- Les routers backend sont trop peu separes : `auth.py` contient un endpoint `/auth/admin/users` qui n'est pas reellement admin, mais seulement teacher.
- Les roles ne sont pas normalises : `orm.User.role` indique seulement `student | teacher` en commentaire ; aucun role `admin` n'est defini fonctionnellement.
- Les ressources pedagogiques ne sont pas modelees cote backend. Elles sont principalement des fichiers statiques et des listes cote frontend.
- Les bilans sont servis comme JSON statique, par exemple `site/EDS_premiere/Second_Degre/bilans_eval1_second_degre.json`, puis filtres cote navigateur dans `student.js` et `dashboard.js`.
- `site/assets/js/auth.js` est a la fois stockage token, fetch wrapper minimal et gestion de formulaire login ; il ne joue pas encore le role de client API commun robuste.
- Les dashboards `student.js` et `dashboard.js` dupliquent les appels, les redirections, la gestion d'erreurs et le chargement des bilans.
- Le README documente encore des commandes et exemples avec des credentials de test en clair, meme si ce ne sont pas des secrets de production.
- Les tests existent mais ne couvrent pas encore l'ensemble des invariants de securite demandes : admin, ressources, bilans, acces inter-groupes.

## 4. Risques de securite

- `apps/backend/app/security.py::require_teacher` accepte uniquement `teacher` et ne connait pas `admin`; les routes admin ne peuvent donc pas etre correctement protegees.
- `apps/backend/app/routers/auth.py::list_users` est expose sous `/auth/admin/users`, mais depend de `require_teacher`. Un enseignant peut donc lister tous les utilisateurs.
- `apps/backend/app/routers/auth.py::reset_student_password` permet a tout enseignant de reinitialiser le mot de passe de tout eleve, sans verifier l'appartenance a un groupe commun.
- `apps/backend/app/routers/groups.py::list_groups` retourne tous les groupes a tout enseignant, sans restriction par association.
- `apps/backend/app/routers/groups.py::list_students` permet a tout enseignant de consulter les eleves de n'importe quel groupe.
- `apps/backend/app/routers/groups.py::list_evaluations` accepte tout utilisateur connecte et ne verifie pas l'appartenance au groupe demande.
- `site/assets/js/student.js::loadSecondDegreBilans` charge directement le JSON complet des bilans puis filtre localement. Un eleve motive peut telecharger le JSON complet.
- `site/assets/js/dashboard.js::loadSecondDegreBilans` fait la meme chose cote enseignant ; le backend ne controle pas les bilans consultables.
- Les mots de passe temporaires sont pratiques, mais il manque `must_change_password` en base et une politique explicite de renouvellement.
- Les endpoints legacy de `compat.py` dupliquent une partie du decodage token et augmentent la surface de maintenance.
- Des fichiers sensibles existent dans la copie locale non versionnee (`apps/backend/outputs/`, `.venv/`, WAL SQLite). Ils sont ignores par Git, mais doivent rester exclus du depot.

## 5. Risques de dette technique

- L'application melange trois niveaux : site statique, backend applicatif, snapshot de production. Les scripts doivent savoir quel niveau ils manipulent.
- Les schemas Pydantic sont incomplets : seuls `schemas/groups.py` et `schemas_tree.py` existent ; il manque `auth.py`, `users.py`, `resources.py`, `evaluations.py`.
- Il n'existe pas de couche service pour les autorisations ressources et evaluations. La logique est dans les routers ou dans le JS.
- `orm.ensure_bootstrap` et `main.py` ont des responsabilites proches mais pas totalement alignees pour le bootstrap groupes/enseignants.
- Les tests sont repartis entre `tests/` et `apps/backend/tests/`, ce qui peut creer des doublons et des fixtures divergentes.
- `site/dist/`, `node_modules/`, `.pytest_cache/` et autres artefacts sont presents localement dans le snapshot ; ils sont ignores, mais polluent l'audit humain.

## 6. Incoherences frontend/backend/DB

- La DB connait `User`, `Group`, `user_groups`; le frontend manipule aussi des groupes via mapping statique dans `student.js` (`P-EDS-6`, `T-EDS-3`, `MX-1`).
- Les ressources visibles par l'eleve sont decidees par `student.js`, alors que le backend devrait appliquer la regle d'acces.
- Les evaluations sont exposees par `/groups/{code}/evaluations`, mais ce endpoint renvoie une structure statique et ne s'appuie pas sur un modele `Evaluation`.
- Les bilans n'ont pas de table `StudentReport` ni de service backend ; ils restent dans un JSON statique.
- `auth.js` redirige apres login vers `dashboard.html`, alors que le role devrait router un eleve vers `student.html`, un enseignant vers `dashboard.html` et un admin vers un espace admin.
- Les cookies sont poses par `compat.py`, tandis que le frontend utilise surtout `localStorage`. Les deux mecanismes coexistent sans modele explicite.

## 7. Etat reel de l'authentification

- Login principal moderne : `POST /auth/token` dans `apps/backend/app/routers/auth.py::login_for_access_token`.
- Login legacy frontend : `POST /api/v1/login-form` dans `compat.py`, appele par `site/assets/js/auth.js`.
- Utilisateur courant moderne : `GET /auth/me`.
- Session legacy : `GET /api/v1/session`, appele par `student.js` et `dashboard.js`.
- Le token JWT contient `sub` et `exp`, cree par `security.create_access_token`.
- `get_current_user` charge l'utilisateur depuis `sub` et renvoie `401` si le token est invalide, expire, absent ou si l'utilisateur est inactif.
- `change_password` impose une longueur de 8 a 128 caracteres, mais il n'existe pas encore de validation plus riche ni de champ `must_change_password`.
- `logout` legacy supprime le cookie, mais le logout frontend depend aussi de `localStorage`.

## 8. Etat reel des roles

- Role actuel en base : champ texte `User.role`, defaut `student`.
- Roles effectivement utilises : `student`, `teacher`.
- Role `admin` absent de la logique.
- `require_teacher` refuse les eleves, mais refuse aussi un futur admin.
- Les routes supposees admin ne sont pas separees dans `routers/admin.py`.
- Les permissions par groupe ne sont pas appliquees cote backend pour les enseignants.

## 9. Etat reel des dashboards

- `site/student.html` + `site/assets/js/student.js` constituent l'espace eleve.
- `site/dashboard.html` + `site/assets/js/dashboard.js` constituent l'espace enseignant.
- Aucun `admin.html` ou `admin-dashboard.html` operationnel n'a ete identifie.
- Le dashboard eleve affiche les groupes via `/auth/me/groups`, mais les ressources sont construites par mapping local.
- Le dashboard eleve affiche les bilans a partir de `bilans_eval1_second_degre.json`, filtre cote navigateur.
- Le dashboard enseignant affiche les groupes via `/groups/`, les eleves via `/groups/{code}/students`, et les bilans depuis le meme JSON statique.
- Les etats chargement/erreur/vide existent partiellement, mais ne sont pas uniformises par composant.

## 10. Etat reel des ressources pedagogiques

- Les ressources sont principalement des fichiers HTML sous `site/EDS_premiere`, `site/EDS_terminale`, `site/Maths_expertes`.
- `site/assets/contents.json` sert d'index de contenus pour certaines vues.
- `site/assets/js/contents.js`, `levels.js`, `search-utils.js` fournissent des fonctions de recherche et de navigation.
- Il n'existe pas de table `Resource`, ni de route `/resources/my`, ni de modele d'acces `public | authenticated | group | teacher | admin`.
- Les groupes compatibles doivent rester `P-EDS-6`, `T-EDS-3`, `MX-1`.

## 11. Etat reel des tests

- Tests backend applicatifs : `tests/test_auth_routes.py`, `tests/test_groups_api.py`, `tests/test_security.py`, `tests/test_config.py`.
- Tests backend plus anciens : `apps/backend/tests/`.
- Tests E2E : `tests/e2e/auth_dashboard.spec.ts`, `login_flow.spec.ts`, `role_routing.spec.ts`, `teacher_actions.spec.ts`, `teacher_bilan.spec.ts`, `comprehensive_links.spec.ts`.
- Tests unitaires frontend : `tests/unit/bilans.spec.js`, `tests/unit/search.spec.js`.
- Scripts npm : `test:unit`, `test:e2e`, `test:e2e:local`, `test`, `lint`, `verify:all`, `build:site`.
- Les tests actuels ne prouvent pas encore que :
  - un enseignant est limite a ses groupes ;
  - un admin seul peut acceder aux endpoints admin ;
  - un eleve ne peut pas lire le bilan d'un autre eleve ;
  - les ressources sont filtrees par role/groupe cote backend.

## 12. Plan de refactorisation par phases

### Phase 1 - Audit et cadrage

- Conserver ce document comme reference technique.
- Documenter explicitement que l'application historique est sous `var-www/maths.labomaths.tn/Interface_Maths_2025_2026/`.
- Identifier les artefacts locaux ignores qui ne doivent jamais etre commit : `.venv/`, `node_modules/`, `apps/backend/outputs/`, `apps/backend/data/*.db*`, `test-results/`.

### Phase 2 - Securite, roles et autorisations backend

- Ajouter les roles `admin`, `teacher`, `student` de facon explicite.
- Ajouter `must_change_password`, `updated_at`, eventuellement `last_login_at`.
- Creer/renforcer `require_active_user`, `require_teacher`, `require_admin`, `require_teacher_for_group`.
- Restreindre `/groups/`, `/groups/{code}/students`, `/auth/reset-student-password`.
- Deplacer les endpoints admin vers un router `routers/admin.py`.

### Phase 3 - Client API frontend commun

- Creer `site/assets/js/api-client.js`.
- Centraliser base URL, token, headers `Authorization`, parsing JSON, gestion 401/403, `getMe()`, `logout()`.
- Faire de `auth.js` une couche login/redirection compatible, au lieu d'un fetch wrapper disperse.

### Phase 4 - Ressources pedagogiques

- Creer un manifeste `site/assets/data/resources.json` comme premiere etape compatible.
- Ajouter une route `/resources/my` et `/resources/{id}` qui applique les regles d'acces cote backend.
- Preparer un modele SQLAlchemy `Resource` pour la migration DB progressive.

### Phase 5 - Evaluations et bilans

- Creer `services/evaluation_service.py`.
- Lire le JSON existant cote backend, puis filtrer selon utilisateur/groupe.
- Ajouter `/evaluations/my`, `/evaluations/{id}/my-report`, `/teacher/groups/{code}/evaluations`, `/teacher/students/{student_id}/reports`.
- Garder le JSON existant pendant la transition, mais interdire son usage comme source d'autorisation.

### Phase 6 - Dashboards

- Recomposer `student.js` autour de `/auth/me`, `/auth/me/groups`, `/resources/my`, `/evaluations/my`.
- Recomposer `dashboard.js` autour des groupes autorises, eleves autorises, bilans autorises et reset mot de passe controle.
- Ajouter une page admin minimale si le role admin est disponible.

### Phase 7 - Tests et documentation

- Ajouter tests backend auth/roles/groupes/ressources/bilans.
- Ajuster les tests Playwright pour les redirections par role et les erreurs 403 propres.
- Mettre a jour `README.md`, `SECURITY_MODEL.md`, `RESOURCE_ACCESS_MODEL.md`, `DASHBOARDS_SPEC.md`, `TEST_PLAN.md`, `CHANGELOG_REFACTOR_AUTH_DASHBOARDS.md`.
