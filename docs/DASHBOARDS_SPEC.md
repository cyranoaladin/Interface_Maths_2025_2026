# Specification dashboards

## Dashboard eleve

Fichiers :

- `site/student.html`
- `site/assets/js/student.js`
- `site/assets/js/api-client.js`

Contenu cible implemente progressivement :

- En-tete : nom, role eleve, deconnexion.
- Apercu : groupes, nombre de ressources, nombre d'evaluations.
- Ressources : chargees depuis `/resources/my`, filtrees par backend.
- Bilans : charge depuis `/evaluations/my` puis `/evaluations/{id}/my-report`.
- Compte : changement de mot de passe via `/auth/change-password`.

## Dashboard enseignant

Fichiers :

- `site/dashboard.html`
- `site/assets/js/dashboard.js`
- `site/assets/js/api-client.js`

Contenu cible implemente progressivement :

- En-tete : nom, role enseignant/admin, deconnexion.
- Groupes : charge depuis `/groups/`, deja limite par backend.
- Eleves : charge depuis `/groups/{code}/students`.
- Evaluations : compteur via `/teacher/groups/{code}/evaluations`.
- Bilans : detail via `/teacher/students/{student_id}/reports`.
- Reset mot de passe : `/auth/reset-student-password`, limite cote backend aux groupes autorises.

## Admin minimal

Les routes `/admin/users` et `/admin/groups` existent. Une page `admin.html` ou un onglet admin dans `dashboard.html` reste a produire pour la gestion avancee.
