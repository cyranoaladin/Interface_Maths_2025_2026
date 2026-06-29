# Architecture cible

## Positionnement

Le depot Git est une copie de production. L'application pédagogique historique reste sous `var-www/maths.labomaths.tn/Interface_Maths_2025_2026/`. Les nouveaux documents d'architecture sont places dans `docs/` a la racine Git pour cadrer tout le snapshot.

## Couches

- Espace public : pages statiques sous `site/`.
- Espace eleve : `site/student.html`, `site/assets/js/student.js`, routes `/resources/my`, `/evaluations/my`.
- Espace enseignant : `site/dashboard.html`, `site/assets/js/dashboard.js`, routes `/groups/`, `/groups/{code}/students`, `/teacher/...`.
- Espace admin minimal : routes `/admin/users`, `/admin/groups`, UI a formaliser ensuite.
- Backend : `apps/backend/app/main.py`, routers `auth`, `groups`, `resources`, `evaluations`, `admin`.
- Donnees : SQLAlchemy pour users/groups et preparation Resource/Evaluation/StudentReport ; JSON conserve temporairement pour les bilans existants.

## Structure cible progressive

```text
apps/backend/app/
  main.py
  config.py
  db.py
  security.py
  orm.py
  routers/
    auth.py
    groups.py
    resources.py
    evaluations.py
    admin.py
  schemas/
    groups.py
    resources.py
    evaluations.py
  services/
    resource_access.py
    evaluation_service.py

site/
  login.html
  student.html
  dashboard.html
  assets/js/
    api-client.js
    auth.js
    student.js
    dashboard.js
    bilans.js
  assets/data/resources.json
```

## Regle d'evolution

Les pages existantes ne sont pas supprimees. Les migrations sont legeres et compatibles SQLite : ajout de colonnes et introduction de nouveaux modeles sans casser les imports CSV ni les anciennes pages.
